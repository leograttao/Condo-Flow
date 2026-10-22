import { Handler, chain } from "./Handler.js";
import { requireValue } from "../../errors.js";
class ConteudoChamadoHandler extends Handler {
  async validate({ data }) {
    requireValue(
      data.titulo.length >= 5 && data.descricao.length >= 10,
      "Informe um título e uma descrição mais completos.",
    );
  }
}
class PrioridadeChamadoHandler extends Handler {
  async validate({ data }) {
    requireValue(
      ["baixa", "media", "alta"].includes(data.prioridade),
      "Prioridade inválida.",
    );
  }
}
class ResponsavelChamadoHandler extends Handler {
  async validate({ data, connection }) {
    if (!data.prestador_id) {
      requireValue(
        !["atribuido", "em_execucao", "aguardando_aprovacao"].includes(
          data.status,
        ),
        "Selecione um prestador para essa etapa.",
      );
      return;
    }
    const [rows] = await connection.execute(
      "SELECT id FROM prestadores WHERE id=?",
      [data.prestador_id],
    );
    requireValue(rows.length, "Prestador não encontrado.");
  }
}
export function chamadoChain() {
  return chain(
    new ConteudoChamadoHandler(),
    new PrioridadeChamadoHandler(),
    new ResponsavelChamadoHandler(),
  );
}
