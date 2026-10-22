import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";
import { pool } from "./db.js";
import {
  login,
  logout,
  authenticate,
  checkPassword,
  hashPassword,
  tokenHash,
} from "./auth.js";
import { permissions, allow } from "./policy.js";
import { AppError, requireValue } from "./errors.js";
import * as service from "./service.js";
const app = express();
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; frame-ancestors 'none'",
  );
  if (req.path.startsWith("/api/")) res.setHeader("Cache-Control", "no-store");
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && req.headers.origin) {
    const origin = new URL(req.headers.origin);
    requireValue(
      origin.host === req.headers.host,
      "Origem não autorizada.",
      403,
    );
  }
  next();
});
app.use(express.json({ limit: "3mb" }));
// Limite simples contra tentativas repetidas de login, suficiente para a demonstração local.
const attempts = new Map();
setInterval(() => {
  for (const [key, value] of attempts)
    if (value.until < Date.now()) attempts.delete(key);
}, 60000).unref();
app.post(
  "/api/login",
  (req, res, next) => {
    const key = req.ip;
    const value = attempts.get(key);
    if (!value || value.until < Date.now())
      attempts.set(key, { count: 1, until: Date.now() + 60000 });
    else {
      value.count++;
      requireValue(
        value.count <= 30,
        "Muitas tentativas. Aguarde um minuto.",
        429,
      );
    }
    next();
  },
  login,
);
app.use("/api", authenticate);
app.get("/api/me", (req, res) =>
  res.json({ user: req.user, permissions: permissions[req.user.perfil] }),
);
app.post("/api/logout", logout);
app.post("/api/password", async (req, res) => {
  const [[user]] = await pool.execute(
    "SELECT senha_hash FROM usuarios WHERE id=?",
    [req.user.id],
  );
  requireValue(
    checkPassword(req.body.atual, user.senha_hash),
    "Senha atual incorreta.",
  );
  await pool.execute("UPDATE usuarios SET senha_hash=? WHERE id=?", [
    hashPassword(req.body.nova),
    req.user.id,
  ]);
  await pool.execute(
    "DELETE FROM sessoes WHERE usuario_id=? AND token_hash<>?",
    [req.user.id, tokenHash(req.sessionToken)],
  );
  res.json({ ok: true });
});
app.get("/api/lookups", async (req, res) =>
  res.json(await service.lookups(req.user)),
);
app.get("/api/notificacoes", async (req, res) => {
  const [rows] = await pool.execute(
    "SELECT * FROM notificacoes WHERE usuario_id=? ORDER BY id DESC LIMIT 50",
    [req.user.id],
  );
  res.json(rows);
});
app.post("/api/notificacoes/:id/ler", async (req, res) => {
  await pool.execute(
    "UPDATE notificacoes SET lida=TRUE WHERE id=? AND usuario_id=?",
    [req.params.id, req.user.id],
  );
  res.json({ ok: true });
});
app.get("/api/anexos/:id", async (req, res) => {
  const [[file]] = await pool.execute("SELECT * FROM anexos WHERE id=?", [
    req.params.id,
  ]);
  requireValue(file, "Anexo não encontrado.", 404);
  allow(req.user, file.recurso, "list");
  await service.accessible(pool, req.user, file.recurso, file.registro_id);
  res
    .type(file.mime)
    .setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(file.nome)}`,
    );
  res.send(file.conteudo);
});
app.get("/api/visitantes/:id/qr", async (req, res) => {
  allow(req.user, "visitantes", "list");
  const row = await service.accessible(
    pool,
    req.user,
    "visitantes",
    req.params.id,
  );
  res
    .type("png")
    .send(await QRCode.toBuffer(row.codigo, { width: 240, margin: 2 }));
});
app.get("/api/reservas/agenda/:area", async (req, res) => {
  allow(req.user, "reservas", "list");
  const [[area]] = await pool.execute("SELECT * FROM areas WHERE id=?", [
    req.params.area,
  ]);
  requireValue(
    area &&
      (req.user.perfil === "sindico" ||
        area.condominio_id === req.user.condominio_id),
    "Área não encontrada.",
    404,
  );
  const [rows] = await pool.execute(
    "SELECT inicio,fim FROM reservas WHERE area_id=? AND status='confirmada' AND fim>NOW() ORDER BY inicio",
    [req.params.area],
  );
  res.json(rows);
});
app.get("/api/:resource", async (req, res) =>
  res.json(await service.list(req.user, req.params.resource)),
);
app.get("/api/:resource/:id", async (req, res) =>
  res.json(await service.detail(req.user, req.params.resource, req.params.id)),
);
app.post("/api/:resource", async (req, res) =>
  res
    .status(201)
    .json(await service.save(req.user, req.params.resource, req.body)),
);
app.put("/api/:resource/:id", async (req, res) =>
  res.json(
    await service.save(
      req.user,
      req.params.resource,
      req.body,
      Number(req.params.id),
    ),
  ),
);
app.delete("/api/:resource/:id", async (req, res) =>
  res.json(await service.remove(req.user, req.params.resource, req.params.id)),
);
app.post("/api/:resource/:id/:action", async (req, res) =>
  res.json(
    await service.action(
      req.user,
      req.params.resource,
      req.params.id,
      req.params.action,
      req.body,
    ),
  ),
);
app.use("/api", (req, res) =>
  res.status(404).json({ error: "Rota não encontrada." }),
);
app.use(
  express.static(
    path.join(path.dirname(fileURLToPath(import.meta.url)), "../frontend"),
  ),
);
app.use((error, req, res, next) => {
  let message = error.message,
    status = error.status || 500;
  if (error.code === "ER_DUP_ENTRY") {
    status = 409;
    message = "Este e-mail ou esta unidade já está cadastrado.";
  }
  if (error.code === "ER_ROW_IS_REFERENCED_2") {
    status = 409;
    message =
      "Existem registros vinculados. Exclua ou transfira os vínculos antes de excluir.";
  }
  if (error.code === "ER_NO_REFERENCED_ROW_2") {
    status = 400;
    message = "Um dos registros selecionados não existe mais. Atualize a tela.";
  }
  if (
    error.code === "ER_LOCK_DEADLOCK" ||
    error.code === "ER_LOCK_WAIT_TIMEOUT"
  ) {
    status = 409;
    message = "Outro registro está sendo atualizado. Tente novamente.";
  }
  if (status === 413)
    message = "Arquivo muito grande. Use um anexo de até 2 MB.";
  if (status >= 500) {
    console.error(error);
    message =
      "Não foi possível concluir. Verifique o servidor e a conexão com o MySQL.";
  }
  res.status(status).json({ error: message });
});
export { app };
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    await pool.query("SELECT 1");
    const port = Number(process.env.PORT || 3000);
    app.listen(port, "0.0.0.0", () =>
      console.log(`CondoFlow em http://localhost:${port}`),
    );
  } catch (error) {
    console.error(
      "MySQL indisponível. Confira o .env, inicie o MySQL e execute npm run db:setup.",
    );
    console.error(error.code || error.message);
    await pool.end();
    process.exitCode = 1;
  }
}
