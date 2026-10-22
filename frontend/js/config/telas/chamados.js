// Configuração da tela Chamados; o crud.js usa essa definição para validar e apresentar os campos.
export const chamados = {
  "title": "Chamados",
  "singular": "chamado",
  "icon": "tool",
  "description": "Cada solicitação acompanhada, do início à solução.",
  "fields": [
    {
      "name": "morador_id",
      "label": "Solicitante",
      "type": "select",
      "source": "moradores"
    },
    {
      "name": "titulo",
      "label": "Título",
      "type": "text"
    },
    {
      "name": "categoria",
      "label": "Categoria",
      "type": "select",
      "options": {
        "manutencao": "Manutenção",
        "ocorrencia": "Ocorrência"
      },
      "default": "manutencao"
    },
    {
      "name": "local",
      "label": "Local",
      "type": "text"
    },
    {
      "name": "descricao",
      "label": "Descrição",
      "type": "textarea"
    },
    {
      "name": "prioridade",
      "label": "Prioridade",
      "type": "select",
      "options": {
        "baixa": "Baixa",
        "media": "Média",
        "alta": "Alta"
      },
      "default": "media"
    },
    {
      "name": "prestador_id",
      "label": "Prestador responsável",
      "type": "select",
      "source": "prestadores",
      "optional": true
    },
    {
      "name": "status",
      "label": "Situação",
      "type": "select",
      "options": {
        "aberto": "Aberto",
        "em_analise": "Em análise",
        "atribuido": "Prestador acionado",
        "em_execucao": "Em execução",
        "aguardando_aprovacao": "Aguardando aprovação",
        "resolvido": "Resolvido"
      },
      "default": "aberto"
    },
    {
      "name": "relato",
      "label": "Relato do serviço / justificativa",
      "type": "textarea",
      "optional": true
    }
  ],
  "columns": [
    "titulo",
    "morador_id",
    "categoria",
    "prioridade",
    "status"
  ],
  "attachment": true
};
