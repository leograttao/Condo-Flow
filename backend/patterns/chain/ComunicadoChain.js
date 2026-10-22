import { Handler, chain } from "./Handler.js";
import { requireValue } from "../../errors.js";
class PerfilComunicadoHandler extends Handler {
  async validate({ user }) {
    requireValue(
      user.perfil === "sindico",
      "Somente o síndico publica comunicados.",
      403,
    );
  }
}
class ConteudoComunicadoHandler extends Handler {
  async validate({ data }) {
    requireValue(
      data.titulo.length >= 5 && data.mensagem.length >= 10,
      "Revise o título e a mensagem do comunicado.",
    );
  }
}
class DestinoComunicadoHandler extends Handler {
  async validate({ data, connection }) {
    if (!data.bloco) return;
    const [rows] = await connection.execute(
      "SELECT id FROM unidades WHERE condominio_id=? AND bloco=? LIMIT 1",
      [data.condominio_id, data.bloco],
    );
    requireValue(
      rows.length,
      "O bloco informado não pertence a esse condomínio.",
    );
  }
}
export function comunicadoChain() {
  return chain(
    new PerfilComunicadoHandler(),
    new ConteudoComunicadoHandler(),
    new DestinoComunicadoHandler(),
  );
}
