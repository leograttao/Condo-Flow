import { statusLabels } from "./schema.js";
export const $ = (selector) => document.querySelector(selector);
export const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
export function date(value) {
  return value
    ? new Date(value.replace(" ", "T")).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "—";
}
export function money(value) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
export function badge(value) {
  return `<span class="badge ${esc(value)}">${esc(statusLabels[value] || value || "—")}</span>`;
}
export function toast(message, error = false) {
  const el = $("#toast");
  el.textContent = message;
  el.className = `visible ${error ? "error" : ""}`;
  clearTimeout(el.timer);
  el.timer = setTimeout(() => (el.className = ""), error ? 8000 : 4500);
}
export async function api(url, method = "GET", body) {
  const response = await fetch("/api" + url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401 && url !== "/login" && url !== "/me")
      window.location.reload();
    throw new Error(data.error || "Não foi possível concluir.");
  }
  return data;
}
export function localInput(value) {
  return value ? value.replace(" ", "T").slice(0, 16) : "";
}
export function nextDay(hours = 10) {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hours, 0, 0, 0);
  return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
export async function fileData(file) {
  if (!file?.size) return null;
  if (file.size > 2 * 1024 * 1024)
    throw new Error("Use um arquivo de até 2 MB.");
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return { nome: file.name, base64 };
}
