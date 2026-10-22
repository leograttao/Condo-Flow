const form = document.querySelector("#login-form");
const errorBox = document.querySelector("#login-error");
const profiles = document.querySelectorAll("[data-profile]");
let selectedProfile = "morador";

profiles.forEach((button) => button.addEventListener("click", () => {
  selectedProfile = button.dataset.profile;
  profiles.forEach((item) => {
    const selected = item === button;
    item.classList.toggle("selected", selected);
    item.setAttribute("aria-pressed", String(selected));
  });
}));

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorBox.textContent = "";
  const values = Object.fromEntries(new FormData(form));
  try {
    const response = await fetch("/api/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, perfil: selectedProfile }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Não foi possível entrar.");
    const requested = new URLSearchParams(location.search).get("next");
    if (requested?.startsWith("/")) {
      location.href = requested;
      return;
    }
    const firstPage = {
      sindico: "condominios",
      morador: "reservas",
      porteiro: "visitantes",
      prestador: "chamados",
    }[selectedProfile];
    location.href = `/telas/${firstPage}.html`;
  } catch (error) {
    errorBox.textContent = error.message;
  }
});
