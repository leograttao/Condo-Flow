import { modules, profiles, statusLabels } from "./schema.js";

const api = async (path, method = "GET", body) => {
  const response = await fetch("/api" + path, {
    method,
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Não foi possível concluir.");
  return result;
};

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);

const prettyDate = (value) => {
  if (!value) return "—";
  const parsed = new Date(String(value).replace(" ", "T"));
  return Number.isNaN(+parsed) ? value : parsed.toLocaleString("pt-BR");
};

async function fileAsBase64(file) {
  if (!file || !file.size) return null;
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return { nome: file.name, base64 };
}

function relationLabel(config, lookups, column, value) {
  const field = config.fields.find((item) => item.name === column);
  if (field?.source) {
    const row = lookups[field.source]?.find((item) => Number(item.id) === Number(value));
    return row?.nome || `#${value}`;
  }
  if (field?.type === "datetime-local") return prettyDate(value);
  if (field?.options) return field.options[value] || value;
  if (column === "status" || column === "tipo" || column === "prioridade")
    return statusLabels[value] || value || "—";
  return value ?? "—";
}

function editable(resource, row, user, permissions) {
  if (!permissions[resource]?.includes("update")) return false;
  if (resource === "visitantes") return row.status === "autorizado";
  if (resource === "encomendas") return row.status === "pendente";
  if (resource === "reservas") return new Date(row.inicio) > new Date();
  if (resource === "chamados" && user.perfil === "morador") return row.status === "aberto";
  if (resource === "chamados" && user.perfil === "prestador")
    return ["atribuido", "em_execucao"].includes(row.status);
  return true;
}

export async function initCrud(resource, hooks = {}) {
  const config = hooks.config || modules[resource];
  const form = document.querySelector("#record-form");
  const dialog = document.querySelector("#record-dialog");
  const tbody = document.querySelector("#records");
  const errorBox = document.querySelector("#form-error");
  const messageBox = document.querySelector("#message");
  let user, permissions, lookups = {}, rows = [];

  const showMessage = (message, error = false) => {
    messageBox.textContent = message;
    messageBox.classList.toggle("error", error);
    messageBox.hidden = !message;
  };

  try {
    const session = await api("/me");
    user = session.user;
    permissions = session.permissions;
  } catch {
    const next = encodeURIComponent(location.pathname + location.search);
    location.href = `/login.html?next=${next}`;
    return;
  }
  if (!permissions[resource]?.includes("list")) {
    const firstPage = {
      sindico: "condominios",
      morador: "reservas",
      porteiro: "visitantes",
      prestador: "chamados",
    }[user.perfil];
    location.href = `/telas/${firstPage}.html`;
    return;
  }

  document.querySelector("#user-name").textContent = user.nome;
  document.querySelector("#user-role").textContent = profiles[user.perfil];
  document.querySelectorAll("[data-resource]").forEach((link) => {
    const resourceName = link.dataset.resource;
    link.hidden = !permissions[resourceName]?.includes("list");
    if (resourceName === resource) link.classList.add("current");
  });
  document.querySelectorAll("[data-create]").forEach((button) => {
    button.hidden = !permissions[resource]?.includes("create");
  });

  try {
    lookups = await api("/lookups");
    for (const field of config.fields) {
      if (!field.source) continue;
      const select = form.elements.namedItem(field.name);
      for (const option of lookups[field.source] || []) {
        select.add(new Option(option.nome, option.id));
      }
    }
  } catch (error) {
    showMessage(error.message, true);
  }

  const render = () => {
    const query = document.querySelector("#search").value.trim().toLocaleLowerCase("pt-BR");
    const filtered = rows.filter((row) => config.columns.some((column) =>
      String(relationLabel(config, lookups, column, row[column])).toLocaleLowerCase("pt-BR").includes(query),
    ));
    document.querySelector("#record-count").textContent = `${filtered.length} registro(s)`;
    tbody.replaceChildren();
    for (const row of filtered) {
      const tr = document.createElement("tr");
      tr.innerHTML = config.columns.map((column) =>
        `<td>${escapeHtml(relationLabel(config, lookups, column, row[column]))}</td>`,
      ).join("");
      const actions = document.createElement("td");
      actions.className = "actions";
      if (editable(resource, row, user, permissions)) {
        const edit = document.createElement("button");
        edit.className = "button button-light button-small";
        edit.textContent = "Editar";
        edit.addEventListener("click", () => openForm(row));
        actions.append(edit);
      }
      const canDelete = permissions[resource]?.includes("delete") &&
        (user.perfil === "sindico" || editable(resource, row, user, permissions));
      if (canDelete) {
        const remove = document.createElement("button");
        remove.className = "button button-danger button-small";
        remove.textContent = "Excluir";
        remove.addEventListener("click", async () => {
          if (!confirm("Deseja excluir este registro?")) return;
          try {
            await api(`/${resource}/${row.id}`, "DELETE");
            await loadRows();
            showMessage("Registro excluído.");
          } catch (error) { showMessage(error.message, true); }
        });
        actions.append(remove);
      }
      tr.append(actions);
      tbody.append(tr);
    }
    if (!filtered.length) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td class="empty-cell" colspan="${config.columns.length + 1}">Nenhum registro encontrado.</td>`;
      tbody.append(tr);
    }
  };

  async function loadRows() {
    try { rows = await api(`/${resource}`); render(); }
    catch (error) { showMessage(error.message, true); }
  }

  function openForm(row = null) {
    form.reset();
    errorBox.textContent = "";
    form.dataset.id = row?.id || "";
    document.querySelector("#dialog-title").textContent = row ? `Editar ${config.singular}` : `Cadastrar ${config.singular}`;
    document.querySelectorAll("[data-field]").forEach((input) => {
      const name = input.name;
      input.disabled = Boolean(row && resource === "reservas" && ["area_id", "morador_id"].includes(name));
      if (input.type === "password") { input.required = !row; input.value = ""; return; }
      if (row) input.value = row[name] ?? "";
      else if (input.dataset.default) input.value = input.dataset.default;
    });
    if (resource === "reservas" && !row) {
      const start = new Date(); start.setDate(start.getDate() + 1); start.setHours(10, 0, 0, 0);
      const end = new Date(start); end.setHours(12, 0, 0, 0);
      form.elements.inicio.value = toLocalInput(start);
      form.elements.fim.value = toLocalInput(end);
      if (user.morador_id) form.elements.morador_id.value = user.morador_id;
    }
    dialog.showModal();
    hooks.afterFormOpen?.({ row, form, dialog, api, user });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.textContent = "";
    const id = form.dataset.id;
    const body = Object.fromEntries(new FormData(form));
    const fileInput = form.elements.arquivo;
    if (fileInput?.files?.[0]) body.anexo = await fileAsBase64(fileInput.files[0]);
    delete body.arquivo;
    if (id && resource === "reservas") {
      const previous = rows.find((item) => String(item.id) === String(id));
      body.area_id = previous.area_id;
      body.morador_id = previous.morador_id;
    }
    try {
      await api(`/${resource}${id ? `/${id}` : ""}`, id ? "PUT" : "POST", body);
      dialog.close();
      await loadRows();
      showMessage("Registro salvo com sucesso.");
    } catch (error) { errorBox.textContent = error.message; }
  });

  document.querySelector("[data-create]").addEventListener("click", () => openForm());
  document.querySelector("#search").addEventListener("input", render);
  document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => dialog.close()));
  document.querySelectorAll("[data-cancel]").forEach((button) => button.addEventListener("click", () => dialog.close()));
  document.querySelector("#logout").addEventListener("click", async () => {
    try { await api("/logout", "POST", {}); }
    finally { location.href = "/login.html"; }
  });
  await loadRows();
}

function toLocalInput(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
