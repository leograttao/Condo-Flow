// Configuração da tela Visitantes; o crud.js usa essa definição para validar e apresentar os campos.
export const visitantes = {
  "title": "Visitantes",
  "singular": "visitante",
  "icon": "visitor",
  "description": "Autorizações, entrada e saída com mais tranquilidade.",
  "fields": [
    {
      "name": "morador_id",
      "label": "Morador responsável",
      "type": "select",
      "source": "moradores"
    },
    {
      "name": "nome",
      "label": "Nome do visitante",
      "type": "text"
    },
    {
      "name": "documento",
      "label": "Documento",
      "type": "text"
    },
    {
      "name": "inicio",
      "label": "Válido a partir de",
      "type": "datetime-local"
    },
    {
      "name": "fim",
      "label": "Válido até",
      "type": "datetime-local"
    }
  ],
  "columns": [
    "nome",
    "morador_id",
    "inicio",
    "fim",
    "status"
  ]
};
