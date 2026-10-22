import { condominios } from "./config/telas/condominios.js";
import { unidades } from "./config/telas/unidades.js";
import { moradores } from "./config/telas/moradores.js";
import { comunicados } from "./config/telas/comunicados.js";
import { visitantes } from "./config/telas/visitantes.js";
import { encomendas } from "./config/telas/encomendas.js";
import { areas } from "./config/telas/areas.js";
import { reservas } from "./config/telas/reservas.js";
import { chamados } from "./config/telas/chamados.js";
import { prestadores } from "./config/telas/prestadores.js";

// Perfis e rótulos usados de forma comum nas telas.
export const profiles = {
  "sindico": "Síndico",
  "morador": "Morador",
  "porteiro": "Porteiro",
  "prestador": "Prestador de serviço"
};

export const modules = {
  condominios,
  unidades,
  moradores,
  comunicados,
  visitantes,
  encomendas,
  areas,
  reservas,
  chamados,
  prestadores,
};

export const statusLabels = {
  ...profiles,
  geral: "Geral",
  urgente: "Urgente",
  pacote: "Pacote",
  documento: "Documento",
  autorizado: "Autorizado",
  entrou: "No condomínio",
  saiu: "Saiu",
  pendente: "Na portaria",
  retirada: "Retirada",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
  disponivel: "Disponível",
  manutencao: "Manutenção",
  ocorrencia: "Ocorrência",
  aberto: "Aberto",
  em_analise: "Em análise",
  atribuido: "Prestador acionado",
  em_execucao: "Em execução",
  aguardando_aprovacao: "Aguardando aprovação",
  resolvido: "Resolvido",
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};
