// Singleton 1: um ponto de criação de notificações por processo Node.
export class NotificacaoManager {
  static #instance;
  constructor() {
    if (NotificacaoManager.#instance) return NotificacaoManager.#instance;
    this.canal = "sistema";
    NotificacaoManager.#instance = this;
  }
  static getInstance() {
    return this.#instance || new NotificacaoManager();
  }
  async enviar(connection, usuarioId, titulo, mensagem) {
    await connection.execute(
      "INSERT INTO notificacoes (usuario_id,titulo,mensagem) VALUES (?,?,?)",
      [usuarioId, titulo, mensagem],
    );
  }
  async paraMorador(connection, moradorId, titulo, mensagem) {
    const [users] = await connection.execute(
      "SELECT id FROM usuarios WHERE morador_id=?",
      [moradorId],
    );
    for (const user of users)
      await this.enviar(connection, user.id, titulo, mensagem);
  }
  async paraCondominio(connection, data, titulo, mensagem) {
    const [users] = await connection.execute(
      `SELECT u.id FROM usuarios u JOIN moradores m ON m.id=u.morador_id
      JOIN unidades un ON un.id=m.unidade_id WHERE un.condominio_id=? AND (? IS NULL OR un.bloco=?)`,
      [data.condominio_id, data.bloco, data.bloco],
    );
    for (const user of users)
      await this.enviar(connection, user.id, titulo, mensagem);
  }
}
