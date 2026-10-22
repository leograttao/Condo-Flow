// Configuração da tela Condomínios; o crud.js usa essa definição para validar e apresentar os campos.
export const condominios = {
  "title": "Condomínios",
  "singular": "condomínio",
  "icon": "building",
  "description": "Informações e regras dos condomínios sob sua gestão.",
  "fields": [
    {
      "name": "nome",
      "label": "Nome",
      "type": "text"
    },
    {
      "name": "endereco",
      "label": "Endereço",
      "type": "text"
    },
    {
      "name": "telefone",
      "label": "Telefone",
      "type": "text"
    },
    {
      "name": "limite_reservas",
      "label": "Reservas ativas por morador",
      "type": "number",
      "min": 1,
      "max": 30,
      "default": 3
    }
  ],
  "columns": [
    "nome",
    "endereco",
    "telefone",
    "limite_reservas"
  ]
};
