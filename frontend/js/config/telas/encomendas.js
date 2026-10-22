// Configuração da tela Encomendas; o crud.js usa essa definição para validar e apresentar os campos.
export const encomendas = {
  "title": "Encomendas",
  "singular": "encomenda",
  "icon": "box",
  "description": "Da chegada à retirada: acompanhe cada entrega.",
  "fields": [
    {
      "name": "morador_id",
      "label": "Destinatário",
      "type": "select",
      "source": "moradores"
    },
    {
      "name": "descricao",
      "label": "Descrição",
      "type": "text"
    },
    {
      "name": "transportadora",
      "label": "Transportadora",
      "type": "text"
    },
    {
      "name": "tipo",
      "label": "Tipo",
      "type": "select",
      "options": {
        "pacote": "Pacote",
        "documento": "Documento"
      },
      "default": "pacote"
    }
  ],
  "columns": [
    "descricao",
    "morador_id",
    "transportadora",
    "status"
  ]
};
