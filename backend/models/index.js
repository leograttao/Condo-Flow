import { Condominio } from "./Condominio.js";
import { Unidade } from "./Unidade.js";
import { Morador } from "./Morador.js";
import { Comunicado } from "./Comunicado.js";
import { Visitante } from "./Visitante.js";
import { Encomenda } from "./Encomenda.js";
import { AreaComum } from "./AreaComum.js";
import { Reserva } from "./Reserva.js";
import { Chamado } from "./Chamado.js";
import { Prestador } from "./Prestador.js";
export const models = {
  condominios: Condominio,
  unidades: Unidade,
  moradores: Morador,
  comunicados: Comunicado,
  visitantes: Visitante,
  encomendas: Encomenda,
  areas: AreaComum,
  reservas: Reserva,
  chamados: Chamado,
  prestadores: Prestador,
};
