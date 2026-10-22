// Configuração da tela Moradores; o crud.js usa essa definição para validar e apresentar os campos.
export const moradores = {
  "title": "Moradores",
  "singular": "morador",
  "icon": "people",
  "description": "Cadastros, contatos e acesso de quem mora aqui.",
  "fields": [
    {
      "name": "unidade_id",
      "label": "Unidade",
      "type": "select",
      "source": "unidades"
    },
    {
      "name": "nome",
      "label": "Nome completo",
      "type": "text"
    },
    {
      "name": "email",
      "label": "E-mail",
      "type": "email"
    },
    {
      "name": "telefone",
      "label": "Telefone",
      "type": "text"
    }
  ],
  "columns": [
    "nome",
    "unidade_id",
    "email",
    "telefone"
  ],
  "account": true
};
