import { requireValue } from "./errors.js";
// Variabilidade por perfil: a mesma tela oferece ações diferentes.
const all = ["list", "create", "update", "delete"];
export const permissions = {
  sindico: Object.fromEntries(
    [
      "condominios",
      "unidades",
      "moradores",
      "comunicados",
      "visitantes",
      "encomendas",
      "areas",
      "reservas",
      "chamados",
      "prestadores",
    ].map((key) => [key, all]),
  ),
  morador: {
    comunicados: ["list"],
    visitantes: all,
    encomendas: ["list"],
    areas: ["list"],
    reservas: all,
    chamados: all,
  },
  porteiro: { visitantes: all, encomendas: all, comunicados: ["list"] },
  prestador: { chamados: ["list", "update"] },
};
export function allow(user, resource, action) {
  requireValue(
    permissions[user.perfil]?.[resource]?.includes(action),
    "Você não tem permissão para esta ação.",
    403,
  );
}
export function scope(user, resource) {
  if (user.perfil === "sindico") return { sql: "1=1", values: [] };
  if (user.perfil === "prestador")
    return { sql: "t.prestador_id=?", values: [user.prestador_id] };
  if (resource === "comunicados")
    return {
      sql: "t.condominio_id=? AND (t.bloco IS NULL OR t.bloco=?)",
      values: [user.condominio_id, user.bloco || null],
    };
  if (resource === "areas")
    return { sql: "t.condominio_id=?", values: [user.condominio_id] };
  if (user.perfil === "morador")
    return { sql: "t.morador_id=?", values: [user.morador_id] };
  return {
    sql: "t.morador_id IN (SELECT m.id FROM moradores m JOIN unidades un ON un.id=m.unidade_id WHERE un.condominio_id=?)",
    values: [user.condominio_id],
  };
}
export function constrainData(user, resource, input, previous) {
  const data = { ...input };
  if (
    user.perfil === "morador" &&
    ["visitantes", "reservas", "chamados"].includes(resource)
  )
    data.morador_id = user.morador_id;
  if (resource === "chamados") {
    if (user.perfil === "morador") {
      requireValue(
        !previous || previous.status === "aberto",
        "Somente chamados abertos podem ser editados pelo morador.",
      );
      data.prestador_id = null;
      data.status = "aberto";
      data.relato = null;
    }
    if (user.perfil === "prestador") {
      requireValue(
        previous && ["atribuido", "em_execucao"].includes(previous.status),
        "Este chamado não está disponível para atualização.",
      );
      requireValue(
        ["em_execucao", "aguardando_aprovacao"].includes(data.status),
        "Escolha em execução ou aguardando aprovação.",
      );
      return { ...previous, status: data.status, relato: data.relato };
    }
    if (user.perfil === "sindico") {
      requireValue(
        data.status !== "resolvido" || previous?.status === "resolvido",
        "Use a ação Aprovar para encerrar o chamado.",
      );
      requireValue(
        data.status !== "aguardando_aprovacao" ||
          previous?.status === "aguardando_aprovacao",
        "O prestador deve enviar a conclusão.",
      );
      if (data.prestador_id && ["aberto", "em_analise"].includes(data.status))
        data.status = "atribuido";
    }
  }
  return data;
}
