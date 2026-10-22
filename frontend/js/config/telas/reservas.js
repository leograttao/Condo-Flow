// Configuração da tela Reservas; o crud.js usa essa definição para validar e apresentar os campos.
export const reservas = {
  "title": "Reservas",
  "singular": "reserva",
  "icon": "calendar",
  "description": "Escolha seu espaço e reserve um momento especial.",
  "fields": [
    {
      "name": "area_id",
      "label": "Área comum",
      "type": "select",
      "source": "areas"
    },
    {
      "name": "morador_id",
      "label": "Morador",
      "type": "select",
      "source": "moradores"
    },
    {
      "name": "inicio",
      "label": "Início",
      "type": "datetime-local"
    },
    {
      "name": "fim",
      "label": "Fim",
      "type": "datetime-local"
    },
    {
      "name": "convidados",
      "label": "Pessoas previstas",
      "type": "number",
      "min": 1,
      "max": 10000,
      "default": 1
    },
    {
      "name": "status",
      "label": "Situação",
      "type": "select",
      "options": {
        "confirmada": "Confirmada",
        "cancelada": "Cancelada"
      },
      "default": "confirmada"
    }
  ],
  "columns": [
    "area_id",
    "morador_id",
    "inicio",
    "fim",
    "status"
  ]
};

// Consulta e mostra os horários ocupados da área escolhida.
export function conectarAgenda({ api, $, date }) {
  const area = $("#field-area_id");
  const agenda = $("#agenda");
  const carregar = async () => {
    if (!area.value) return;
    try {
      const horarios = await api("/reservas/agenda/" + area.value);
      agenda.innerHTML =
        "<b>Horários já ocupados</b><br>" +
        (horarios.map((item) => `${date(item.inicio)} → ${date(item.fim)}`).join("<br>") ||
          "Nenhum agendamento futuro para esta área.");
    } catch (error) {
      agenda.textContent = error.message;
    }
  };
  area.onchange = carregar;
  if (area.value) carregar();
}
