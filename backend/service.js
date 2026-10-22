import { randomBytes } from "node:crypto";
import { pool, transaction } from "./db.js";
import { modules } from "../frontend/js/schema.js";
import { allow, scope, constrainData } from "./policy.js";
import { requireValue } from "./errors.js";
import { validateData } from "./validation.js";
import { hashPassword } from "./auth.js";
import { visitanteChain } from "./patterns/chain/VisitanteChain.js";
import { comunicadoChain } from "./patterns/chain/ComunicadoChain.js";
import { chamadoChain } from "./patterns/chain/ChamadoChain.js";
import { ReservaManager } from "./patterns/singleton/ReservaManager.js";
import { NotificacaoManager } from "./patterns/singleton/NotificacaoManager.js";
import {
  ComunicadoGeral,
  ComunicadoUrgente,
} from "./patterns/template/ComunicadoTemplate.js";
import {
  ChamadoManutencao,
  ChamadoOcorrencia,
} from "./patterns/template/ChamadoTemplate.js";
import {
  EncomendaPacote,
  EncomendaDocumento,
} from "./patterns/template/EncomendaTemplate.js";

export function resourceExists(resource) {
  requireValue(Object.hasOwn(modules, resource), "Tela não encontrada.", 404);
}
export async function accessible(connection, user, resource, id, lock = false) {
  resourceExists(resource);
  const filter = scope(user, resource);
  const [[row]] = await connection.execute(
    `SELECT t.* FROM ${resource} t WHERE t.id=? AND ${filter.sql}${lock ? " FOR UPDATE" : ""}`,
    [id, ...filter.values],
  );
  requireValue(row, "Registro não encontrado ou sem acesso.", 404);
  return row;
}
export async function list(user, resource) {
  resourceExists(resource);
  allow(user, resource, "list");
  const filter = scope(user, resource);
  const [rows] = await pool.execute(
    `SELECT t.* FROM ${resource} t WHERE ${filter.sql} ORDER BY t.id DESC`,
    filter.values,
  );
  // Código de acesso e documento só aparecem nos detalhes autorizados.
  if (resource === "visitantes")
    rows.forEach((row) => {
      delete row.codigo;
      delete row.documento;
    });
  return rows;
}
export async function detail(user, resource, id) {
  allow(user, resource, "list");
  const row = await accessible(pool, user, resource, id);
  const [history] = await pool.execute(
    `SELECT h.acao,h.detalhes,h.criado_em,u.nome FROM historico h
    LEFT JOIN usuarios u ON u.id=h.usuario_id WHERE recurso=? AND registro_id=? ORDER BY h.id DESC`,
    [resource, id],
  );
  const [attachments] = await pool.execute(
    "SELECT id,nome,mime FROM anexos WHERE recurso=? AND registro_id=?",
    [resource, id],
  );
  let readings = [];
  if (resource === "comunicados") {
    const [rows] = await pool.execute(
      `SELECT l.usuario_id,l.lido_em,u.nome FROM leituras l JOIN usuarios u ON u.id=l.usuario_id
      WHERE comunicado_id=? ${user.perfil === "sindico" ? "" : "AND l.usuario_id=?"}`,
      [id, ...(user.perfil === "sindico" ? [] : [user.id])],
    );
    readings = rows;
  }
  return { row, history, attachments, readings };
}
export async function audit(
  connection,
  user,
  resource,
  id,
  action,
  details = "",
) {
  await connection.execute(
    "INSERT INTO historico (usuario_id,recurso,registro_id,acao,detalhes) VALUES (?,?,?,?,?)",
    [user.id, resource, id, action, details],
  );
}
async function validateRelations(connection, user, resource, data) {
  // Foreign keys garantem existência; aqui verificamos relações entre condomínios.
  if (data.morador_id) {
    const [[m]] = await connection.execute(
      "SELECT un.condominio_id FROM moradores m JOIN unidades un ON un.id=m.unidade_id WHERE m.id=?",
      [data.morador_id],
    );
    requireValue(m, "Morador não encontrado.");
    if (["morador", "porteiro"].includes(user.perfil))
      requireValue(
        m.condominio_id === user.condominio_id,
        "Morador de outro condomínio.",
        403,
      );
  }
  if (resource === "reservas")
    await ReservaManager.getInstance().validar(connection, data, data.id || 0);
}
function parseAttachment(file, resource) {
  if (!file) return null;
  requireValue(modules[resource].attachment, "Esta tela não aceita anexos.");
  requireValue(
    typeof file.nome === "string" &&
      file.nome.length <= 180 &&
      typeof file.base64 === "string",
    "Anexo inválido.",
  );
  const bytes = Buffer.from(file.base64, "base64");
  requireValue(
    bytes.length > 0 && bytes.length <= 2 * 1024 * 1024,
    "O anexo deve ter até 2 MB.",
  );
  const png = bytes
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const pdf = bytes.subarray(0, 5).toString() === "%PDF-";
  const mime = png
    ? "image/png"
    : jpeg
      ? "image/jpeg"
      : pdf
        ? "application/pdf"
        : null;
  requireValue(
    mime && (resource === "prestadores" || mime !== "application/pdf"),
    "Use PNG ou JPG (PDF também é aceito em prestadores).",
  );
  return { nome: file.nome, mime, bytes };
}
async function saveAttachment(connection, resource, id, file) {
  if (!file) return;
  const [[{ total }]] = await connection.execute(
    "SELECT COUNT(*) total FROM anexos WHERE recurso=? AND registro_id=?",
    [resource, id],
  );
  requireValue(total < 5, "Máximo de cinco anexos por registro.");
  await connection.execute(
    "INSERT INTO anexos (recurso,registro_id,nome,mime,conteudo) VALUES (?,?,?,?,?)",
    [resource, id, file.nome, file.mime, file.bytes],
  );
}
async function syncAccount(connection, resource, id, data, password, isNew) {
  if (!modules[resource].account) return;
  const foreign = resource === "moradores" ? "morador_id" : "prestador_id";
  const perfil = resource === "moradores" ? "morador" : "prestador";
  if (isNew) {
    const hash = hashPassword(password);
    await connection.execute(
      `INSERT INTO usuarios (nome,email,senha_hash,perfil,${foreign}) VALUES (?,?,?,?,?)`,
      [data.nome, data.email.toLowerCase(), hash, perfil, id],
    );
  } else {
    await connection.execute(
      `UPDATE usuarios SET nome=?,email=? WHERE ${foreign}=?`,
      [data.nome, data.email.toLowerCase(), id],
    );
    if (password) {
      await connection.execute(
        `UPDATE usuarios SET senha_hash=? WHERE ${foreign}=?`,
        [hashPassword(password), id],
      );
      await connection.execute(
        `DELETE FROM sessoes WHERE usuario_id IN (SELECT id FROM usuarios WHERE ${foreign}=?)`,
        [id],
      );
    }
  }
}
export async function save(user, resource, input, id = null) {
  resourceExists(resource);
  allow(user, resource, id ? "update" : "create");
  const file = parseAttachment(input.anexo, resource);
  return transaction(async (connection) => {
    const previous = id
      ? await accessible(connection, user, resource, id, true)
      : null;
    if (resource === "visitantes" && previous)
      requireValue(
        previous.status === "autorizado",
        "Visitantes que já entraram não podem ter a autorização alterada.",
      );
    if (resource === "encomendas" && previous)
      requireValue(
        previous.status === "pendente",
        "Encomendas retiradas não podem ser alteradas.",
      );
    if (resource === "reservas" && previous) {
      requireValue(
        new Date(previous.inicio) > new Date(),
        "Reservas iniciadas não podem ser alteradas.",
      );
      requireValue(
        Number(input.area_id) === previous.area_id &&
          Number(input.morador_id) === previous.morador_id,
        "Para trocar área ou morador, exclua a reserva e crie outra.",
      );
    }
    const data = validateData(
      resource,
      constrainData(user, resource, input, previous),
    );
    if (data.email) data.email = data.email.toLowerCase();
    await validateRelations(connection, user, resource, {
      ...data,
      id: id || 0,
    });
    const context = { connection, user, data };
    if (resource === "visitantes") await visitanteChain().handle(context);
    if (resource === "chamados" && data.status === "aguardando_aprovacao") {
      requireValue(
        data.relato && data.relato.length >= 10,
        "Descreva o serviço realizado (mínimo de 10 caracteres).",
      );
      requireValue(
        file,
        "Anexe uma nova foto como evidência do serviço realizado.",
      );
    }
    // A função de persistência é recebida pelos três Template Methods.
    const persistir = async (values) => {
      const fields = Object.keys(values);
      if (id) {
        await connection.execute(
          `UPDATE ${resource} SET ${fields.map((key) => key + "=?").join(",")} WHERE id=?`,
          [...Object.values(values), id],
        );
        return id;
      }
      const extra =
        resource === "visitantes"
          ? { codigo: randomBytes(24).toString("hex") }
          : {};
      const all = { ...values, ...extra };
      const [result] = await connection.execute(
        `INSERT INTO ${resource} (${Object.keys(all).join(",")}) VALUES (${Object.keys(
          all,
        )
          .map(() => "?")
          .join(",")})`,
        Object.values(all),
      );
      return result.insertId;
    };
    let recordId;
    if (!id && resource === "comunicados")
      recordId = await (
        data.tipo === "urgente"
          ? new ComunicadoUrgente()
          : new ComunicadoGeral()
      ).executar(context, persistir);
    else if (!id && resource === "chamados")
      recordId = await (
        data.categoria === "manutencao"
          ? new ChamadoManutencao()
          : new ChamadoOcorrencia()
      ).executar(context, persistir);
    else if (!id && resource === "encomendas")
      recordId = await (
        data.tipo === "documento"
          ? new EncomendaDocumento()
          : new EncomendaPacote()
      ).executar(context, persistir);
    else {
      if (resource === "comunicados") await comunicadoChain().handle(context);
      if (resource === "chamados") await chamadoChain().handle(context);
      recordId = await persistir(data);
    }
    await syncAccount(connection, resource, recordId, data, input.senha, !id);
    await saveAttachment(connection, resource, recordId, file);
    await audit(
      connection,
      user,
      resource,
      recordId,
      id ? "Atualizado" : "Criado",
      data.relato || (data.status ? `Situação: ${data.status}` : ""),
    );
    const notifications = NotificacaoManager.getInstance();
    if (resource === "reservas")
      await notifications.paraMorador(
        connection,
        data.morador_id,
        "Reserva atualizada",
        `Sua reserva está ${data.status}.`,
      );
    if (id && resource === "chamados")
      await notifications.paraMorador(
        connection,
        data.morador_id,
        "Chamado atualizado",
        data.titulo,
      );
    if (
      resource === "chamados" &&
      data.prestador_id &&
      (!previous || previous.prestador_id !== data.prestador_id)
    ) {
      const [[provider]] = await connection.execute(
        "SELECT id FROM usuarios WHERE prestador_id=?",
        [data.prestador_id],
      );
      if (provider)
        await notifications.enviar(
          connection,
          provider.id,
          "Chamado atribuído",
          data.titulo,
        );
    }
    return { id: recordId };
  });
}
export async function remove(user, resource, id) {
  resourceExists(resource);
  allow(user, resource, "delete");
  return transaction(async (connection) => {
    const row = await accessible(connection, user, resource, id, true);
    if (resource === "chamados")
      requireValue(
        row.status === "aberto" || user.perfil === "sindico",
        "Somente chamados abertos podem ser excluídos.",
      );
    if (resource === "reservas")
      requireValue(
        new Date(row.inicio) > new Date() || user.perfil === "sindico",
        "Reservas passadas não podem ser excluídas.",
      );
    if (resource === "visitantes")
      requireValue(
        row.status === "autorizado" || user.perfil === "sindico",
        "Visitante com acesso registrado não pode ser excluído.",
      );
    if (resource === "encomendas")
      requireValue(
        row.status === "pendente" || user.perfil === "sindico",
        "Encomenda retirada não pode ser excluída.",
      );
    await connection.execute(
      "DELETE FROM anexos WHERE recurso=? AND registro_id=?",
      [resource, id],
    );
    await connection.execute(`DELETE FROM ${resource} WHERE id=?`, [id]);
    await audit(connection, user, resource, id, "Excluído");
    return { ok: true };
  });
}
export async function action(user, resource, id, name, input) {
  resourceExists(resource);
  allow(user, resource, "list");
  return transaction(async (connection) => {
    const row = await accessible(connection, user, resource, id, true);
    if (resource === "comunicados" && name === "ler") {
      await connection.execute(
        "INSERT IGNORE INTO leituras (comunicado_id,usuario_id) VALUES (?,?)",
        [id, user.id],
      );
    } else if (resource === "encomendas" && name === "retirar") {
      requireValue(
        ["sindico", "porteiro"].includes(user.perfil),
        "Somente portaria e síndico registram a retirada.",
        403,
      );
      requireValue(
        row.status === "pendente",
        "Esta encomenda já foi retirada.",
      );
      requireValue(
        typeof input.responsavel === "string" &&
          input.responsavel.trim().length >= 3 &&
          input.responsavel.length <= 180,
        "Informe quem retirou.",
      );
      await connection.execute(
        "UPDATE encomendas SET status='retirada',retirado_por=?,retirada_em=NOW() WHERE id=?",
        [input.responsavel.trim(), id],
      );
      await NotificacaoManager.getInstance().paraMorador(
        connection,
        row.morador_id,
        "Encomenda retirada",
        `Retirada por ${input.responsavel.trim()}.`,
      );
    } else if (
      resource === "visitantes" &&
      ["entrada", "saida"].includes(name)
    ) {
      requireValue(
        ["sindico", "porteiro"].includes(user.perfil),
        "Somente a portaria e o síndico registram acessos.",
        403,
      );
      if (name === "entrada") {
        requireValue(
          input.codigo === row.codigo,
          "QR Code / código de autorização inválido.",
        );
        requireValue(
          row.status === "autorizado" &&
            new Date() >= new Date(row.inicio) &&
            new Date() <= new Date(row.fim),
          "Autorização fora da validade ou já utilizada.",
        );
        await connection.execute(
          "UPDATE visitantes SET status='entrou',entrada_em=NOW() WHERE id=?",
          [id],
        );
      } else {
        requireValue(
          row.status === "entrou",
          "Registre a entrada antes da saída.",
        );
        await connection.execute(
          "UPDATE visitantes SET status='saiu',saida_em=NOW() WHERE id=?",
          [id],
        );
      }
    } else if (
      resource === "chamados" &&
      ["aprovar", "rejeitar"].includes(name)
    ) {
      requireValue(
        user.perfil === "sindico",
        "Somente o síndico aprova ou rejeita a conclusão.",
        403,
      );
      requireValue(
        row.status === "aguardando_aprovacao",
        "Este chamado não aguarda aprovação.",
      );
      requireValue(
        typeof input.justificativa === "string" &&
          input.justificativa.trim().length >= 5 &&
          input.justificativa.length <= 5000,
        "Informe a justificativa da decisão.",
      );
      await connection.execute(
        "UPDATE chamados SET status=?,relato=? WHERE id=?",
        [
          name === "aprovar" ? "resolvido" : "em_execucao",
          input.justificativa.trim(),
          id,
        ],
      );
      await NotificacaoManager.getInstance().paraMorador(
        connection,
        row.morador_id,
        name === "aprovar" ? "Chamado resolvido" : "Conclusão rejeitada",
        input.justificativa.trim(),
      );
    } else requireValue(false, "Ação não encontrada.", 404);
    await audit(
      connection,
      user,
      resource,
      id,
      name,
      input.justificativa || input.responsavel || "",
    );
    return { ok: true };
  });
}
export async function lookups(user) {
  const result = {};
  const admin = user.perfil === "sindico";
  const [condos] = await pool.execute(
    `SELECT id,nome FROM condominios ${admin ? "" : "WHERE id=?"}`,
    admin ? [] : [user.condominio_id || 0],
  );
  result.condominios = condos;
  const [units] = await pool.execute(
    `SELECT id,condominio_id,CONCAT('Bloco ',bloco,' • Apto ',numero) nome FROM unidades ${admin ? "" : "WHERE condominio_id=?"}`,
    admin ? [] : [user.condominio_id || 0],
  );
  result.unidades = units;
  let clause = "",
    values = [];
  if (user.perfil === "morador") {
    clause = "WHERE m.id=?";
    values = [user.morador_id];
  }
  if (user.perfil === "porteiro") {
    clause = "WHERE un.condominio_id=?";
    values = [user.condominio_id];
  }
  if (user.perfil === "prestador") {
    clause =
      "WHERE m.id IN (SELECT morador_id FROM chamados WHERE prestador_id=?)";
    values = [user.prestador_id];
  }
  const [residents] = await pool.execute(
    `SELECT m.id,un.condominio_id,CONCAT(m.nome,' • ',un.bloco,'/',un.numero) nome FROM moradores m JOIN unidades un ON un.id=m.unidade_id ${clause}`,
    values,
  );
  result.moradores = residents;
  const [areas] = await pool.execute(
    `SELECT id,condominio_id,nome,capacidade,taxa,status FROM areas ${admin ? "" : "WHERE condominio_id=?"}`,
    admin ? [] : [user.condominio_id || 0],
  );
  result.areas = areas;
  const [providers] = await pool.execute(
    `SELECT id,nome FROM prestadores ${admin ? "" : "WHERE id=?"}`,
    admin ? [] : [user.prestador_id || 0],
  );
  result.prestadores = providers;
  return result;
}
