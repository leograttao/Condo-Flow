// Configuração da tela Áreas comuns; o crud.js usa essa definição para validar e apresentar os campos.
export const areas = {
  "title": "Áreas comuns",
  "singular": "área comum",
  "icon": "sun",
  "description": "Espaços para aproveitar o melhor da vida em condomínio.",
  "fields": [
    {
      "name": "condominio_id",
      "label": "Condomínio",
      "type": "select",
      "source": "condominios"
    },
    {
      "name": "nome",
      "label": "Nome do espaço",
      "type": "text"
    },
    {
      "name": "capacidade",
      "label": "Capacidade",
      "type": "number",
      "min": 1,
      "max": 10000
    },
    {
      "name": "taxa",
      "label": "Taxa de uso (R$)",
      "type": "number",
      "min": 0,
      "max": 100000,
      "step": "0.01",
      "default": 0
    },
    {
      "name": "status",
      "label": "Disponibilidade",
      "type": "select",
      "options": {
        "disponivel": "Disponível",
        "manutencao": "Em manutenção"
      },
      "default": "disponivel"
    }
  ],
  "columns": [
    "nome",
    "condominio_id",
    "capacidade",
    "taxa",
    "status"
  ]
};
