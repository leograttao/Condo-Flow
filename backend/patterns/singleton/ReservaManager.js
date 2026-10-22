import { requireValue, validPeriod } from "../../errors.js";
import { AreaComum } from "../../models/AreaComum.js";
import { Condominio } from "../../models/Condominio.js";
// Singleton 2. A segurança contra concorrência vem da transação + locks no MySQL.
export class ReservaManager {
  static #instance;
  constructor() {
    if (ReservaManager.#instance) return ReservaManager.#instance;
    this.nome = "Gerenciador de reservas";
    ReservaManager.#instance = this;
  }
  static getInstance() {
    return this.#instance || new ReservaManager();
  }
  async validar(connection, data, id = 0) {
    validPeriod(data.inicio, data.fim, data.status !== "cancelada");
    // Ordem fixa de locks: área, depois morador. Todos os agendamentos passam aqui.
    const [[area]] = await connection.execute(
      "SELECT * FROM areas WHERE id=? FOR UPDATE",
      [data.area_id],
    );
    requireValue(area, "Área não encontrada.");
    const [[morador]] = await connection.execute(
      `SELECT m.*, un.condominio_id FROM moradores m
      JOIN unidades un ON un.id=m.unidade_id WHERE m.id=? FOR UPDATE`,
      [data.morador_id],
    );
    requireValue(
      morador && morador.condominio_id === area.condominio_id,
      "A área deve pertencer ao condomínio do morador.",
    );
    if (data.status === "cancelada") return;
    requireValue(
      new AreaComum(area).comporta(data.convidados),
      "Área em manutenção ou capacidade excedida.",
    );
    const [conflicts] = await connection.execute(
      `SELECT id FROM reservas WHERE area_id=? AND status='confirmada'
      AND id<>? AND inicio < ? AND fim > ? FOR UPDATE`,
      [data.area_id, id, data.fim, data.inicio],
    );
    requireValue(
      !conflicts.length,
      "Este horário já está reservado. Escolha outro período.",
      409,
    );
    const [[condominio]] = await connection.execute(
      "SELECT * FROM condominios WHERE id=?",
      [area.condominio_id],
    );
    const [active] = await connection.execute(
      `SELECT id FROM reservas WHERE morador_id=? AND status='confirmada'
      AND fim>NOW() AND id<>? FOR UPDATE`,
      [data.morador_id, id],
    );
    requireValue(
      new Condominio(condominio).podeReservar(active.length),
      `Limite de ${condominio.limite_reservas} reservas ativas atingido.`,
    );
  }
}
