// Configuração da tela Unidades; o crud.js usa essa definição para validar e apresentar os campos.
export const unidades = {
  "title": "Unidades",
  "singular": "unidade",
  "icon": "door",
  "description": "Apartamentos e blocos, organizados em um só lugar.",
  "fields": [
    {
      "name": "condominio_id",
      "label": "Condomínio",
      "type": "select",
      "source": "condominios"
    },
    {
      "name": "bloco",
      "label": "Bloco",
      "type": "text"
    },
    {
      "name": "numero",
      "label": "Apartamento",
      "type": "text"
    },
    {
      "name": "andar",
      "label": "Andar",
      "type": "number",
      "min": 0,
      "max": 200,
      "default": 0
    }
  ],
  "columns": [
    "condominio_id",
    "bloco",
    "numero",
    "andar"
  ]
};
