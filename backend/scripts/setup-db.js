import mysql from "mysql2/promise";
import { readFile } from "node:fs/promises";
import { dbConfig, pool } from "../db.js";
import { hashPassword } from "../auth.js";
const name = dbConfig.database;
if (!/^[a-zA-Z0-9_]+$/.test(name))
  throw new Error("DB_NAME só pode conter letras, números e sublinhado.");
let connection;
try {
  connection = await mysql.createConnection({
    ...dbConfig,
    database: undefined,
    multipleStatements: true,
  });
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await connection.query(`USE \`${name}\``);
  await connection.query(
    await readFile(new URL("../database/schema.sql", import.meta.url), "utf8"),
  );
  const [[{ total }]] = await connection.query(
    "SELECT COUNT(*) total FROM usuarios",
  );
  if (total) {
    console.log(
      "Estrutura verificada. Dados existentes preservados; exemplos não foram reinseridos.",
    );
  } else {
    // IDs explícitos só no banco novo de demonstração. Nunca apaga dados existentes.
    const [[{ total: condos }]] = await connection.query(
      "SELECT COUNT(*) total FROM condominios",
    );
    if (condos)
      throw new Error(
        "Banco já possui dados sem usuários. Use um DB_NAME vazio para criar a demonstração.",
      );
    await connection.beginTransaction();
    await connection.query(
      await readFile(new URL("../database/seed.sql", import.meta.url), "utf8"),
    );
    const hash = hashPassword("Condo@123");
    const accounts = [
      ["Ricardo Oliveira", "sindico@condoflow.com", "sindico", null, null, 1],
      ["Lucas Almeida", "morador@condoflow.com", "morador", 1, null, null],
      ["João Carlos", "porteiro@condoflow.com", "porteiro", null, null, 1],
      [
        "Marcos Ferreira",
        "prestador@condoflow.com",
        "prestador",
        null,
        1,
        null,
      ],
      ["Ana Beatriz", "ana@condoflow.com", "morador", 2, null, null],
    ];
    for (const [
      nome,
      email,
      perfil,
      morador,
      prestador,
      condominio,
    ] of accounts) {
      await connection.execute(
        "INSERT INTO usuarios (nome,email,senha_hash,perfil,morador_id,prestador_id,condominio_id) VALUES (?,?,?,?,?,?,?)",
        [nome, email, hash, perfil, morador, prestador, condominio],
      );
    }
    await connection.query(
      `INSERT INTO notificacoes (usuario_id,titulo,mensagem) SELECT id,'Bem-vindo ao CondoFlow','Sua rotina de condomínio, mais simples.' FROM usuarios`,
    );
    await connection.commit();
    console.log(
      "Banco criado com exemplos e cinco contas. Senha de demonstração: Condo@123",
    );
  }
  console.log(
    "Pronto. Execute npm start e abra http://localhost:" +
      (process.env.PORT || 3000),
  );
} catch (error) {
  if (connection) await connection.rollback();
  console.error("Falha na preparação:", error.code || error.message);
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (connection) await connection.end();
  await pool.end();
}
