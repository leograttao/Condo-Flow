import { initCrud } from "../crud.js";
import { reservas } from "../config/telas/reservas.js";

function connectAgenda({ form, api }) {
  const area = form.elements.area_id;
  const box = document.querySelector("#agenda");
  const load = async () => {
    if (!area.value) return;
    try {
      const slots = await api("/reservas/agenda/" + area.value);
      box.textContent = slots.length ? "Horários ocupados: " + slots.map((item) => new Date(item.inicio).toLocaleString("pt-BR") + " até " + new Date(item.fim).toLocaleString("pt-BR")).join("; ") : "Nenhum agendamento futuro para esta área.";
    } catch (error) { box.textContent = error.message; }
  };
  area.addEventListener("change", load);
  if (area.value) load();
}

initCrud("reservas", { config: reservas, afterFormOpen: connectAgenda });
