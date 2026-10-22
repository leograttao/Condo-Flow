import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { pool } from "./db.js";
import { requireValue } from "./errors.js";
export function hashPassword(password) {
  requireValue(
    typeof password === "string" &&
      password.length >= 8 &&
      password.length <= 128,
    "A senha deve ter de 8 a 128 caracteres.",
  );
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(password, salt, 64).toString("hex");
}
export function checkPassword(password, stored) {
  if (typeof password !== "string" || password.length > 128 || !stored)
    return false;
  const [salt, hash] = stored.split(":");
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export const tokenHash = (token) =>
  createHash("sha256").update(token).digest("hex");
const cookieOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure: process.env.COOKIE_SECURE === "true",
  path: "/",
};
export async function login(req, res) {
  const { email, senha, perfil } = req.body;
  const [[user]] = await pool.execute("SELECT * FROM usuarios WHERE email=?", [
    String(email || "")
      .toLowerCase()
      .trim(),
  ]);
  requireValue(
    user && checkPassword(senha, user.senha_hash) && user.perfil === perfil,
    "E-mail, senha ou perfil incorretos.",
    401,
  );
  const token = randomBytes(32).toString("hex");
  await pool.execute("DELETE FROM sessoes WHERE expira_em<NOW()");
  await pool.execute(
    "INSERT INTO sessoes (token_hash,usuario_id,expira_em) VALUES (?,?,DATE_ADD(NOW(),INTERVAL 8 HOUR))",
    [tokenHash(token), user.id],
  );
  res.cookie("condoflow", token, { ...cookieOptions, maxAge: 8 * 3600000 });
  res.json({ ok: true });
}
export async function authenticate(req, res, next) {
  const token = req.headers.cookie
    ?.split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith("condoflow="))
    ?.slice(10);
  requireValue(
    token && /^[a-f0-9]{64}$/.test(token),
    "Faça login para continuar.",
    401,
  );
  const [[user]] = await pool.execute(
    `SELECT u.id,u.nome,u.email,u.perfil,u.morador_id,u.prestador_id,
    COALESCE(un.condominio_id,u.condominio_id) condominio_id, un.bloco, un.numero
    FROM sessoes s JOIN usuarios u ON u.id=s.usuario_id LEFT JOIN moradores m ON m.id=u.morador_id
    LEFT JOIN unidades un ON un.id=m.unidade_id WHERE s.token_hash=? AND s.expira_em>NOW()`,
    [tokenHash(token)],
  );
  requireValue(user, "Sua sessão expirou. Entre novamente.", 401);
  req.user = user;
  req.sessionToken = token;
  next();
}
export async function logout(req, res) {
  await pool.execute("DELETE FROM sessoes WHERE token_hash=?", [
    tokenHash(req.sessionToken),
  ]);
  res.clearCookie("condoflow", cookieOptions);
  res.json({ ok: true });
}
