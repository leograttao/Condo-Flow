// Configuração da tela Prestadores; o crud.js usa essa definição para validar e apresentar os campos.
export const prestadores = {
  "title": "Prestadores",
  "singular": "prestador",
  "icon": "briefcase",
  "description": "Profissionais e serviços que cuidam do seu condomínio.",
  "fields": [
    {
      "name": "nome",
      "label": "Nome / empresa",
      "type": "text"
    },
    {
      "name": "especialidade",
      "label": "Especialidade",
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
    },
    {
      "name": "documento",
      "label": "CPF / CNPJ",
      "type": "text"
    },
    {
      "name": "contrato",
      "label": "Informações do contrato",
      "type": "textarea",
      "optional": true
    }
  ],
  "columns": [
    "nome",
    "especialidade",
    "telefone",
    "email"
  ],
  "account": true,
  "attachment": true
};
