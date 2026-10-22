import { Handler, chain } from "./Handler.js";
import { requireValue, validPeriod } from "../../errors.js";
class DocumentoVisitanteHandler extends Handler {
  async validate({ data }) {
    requireValue(
      data.documento.replace(/\W/g, "").length >= 5,
      "Informe um documento válido (ao menos 5 caracteres).",
    );
  }
}
class ValidadeVisitanteHandler extends Handler {
  async validate({ data }) {
    validPeriod(data.inicio, data.fim, false);
    requireValue(new Date(data.fim) > new Date(), "A autorização já venceu.");
  }
}
class AutorizacaoVisitanteHandler extends Handler {
  async validate({ data, user }) {
    requireValue(
      ["sindico", "porteiro", "morador"].includes(user.perfil),
      "Perfil sem permissão para visitantes.",
      403,
    );
    if (user.perfil === "morador")
      requireValue(
        data.morador_id === user.morador_id,
        "Você só pode autorizar seus próprios visitantes.",
        403,
      );
  }
}
export function visitanteChain() {
  return chain(
    new DocumentoVisitanteHandler(),
    new ValidadeVisitanteHandler(),
    new AutorizacaoVisitanteHandler(),
  );
}
