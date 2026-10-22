// Configuração da tela Comunicados; o crud.js usa essa definição para validar e apresentar os campos.
export const comunicados = {
  "title": "Comunicados",
  "singular": "comunicado",
  "icon": "megaphone",
  "description": "Avisos importantes para uma comunidade bem informada.",
  "fields": [
    {
      "name": "condominio_id",
      "label": "Condomínio",
      "type": "select",
      "source": "condominios"
    },
    {
      "name": "titulo",
      "label": "Título",
      "type": "text"
    },
    {
      "name": "mensagem",
      "label": "Mensagem",
      "type": "textarea"
    },
    {
      "name": "tipo",
      "label": "Tipo",
      "type": "select",
      "options": {
        "geral": "Geral",
        "urgente": "Urgente"
      },
      "default": "geral"
    },
    {
      "name": "bloco",
      "label": "Bloco destinatário (vazio = todos)",
      "type": "text",
      "optional": true
    }
  ],
  "columns": [
    "titulo",
    "condominio_id",
    "tipo",
    "bloco"
  ]
};
