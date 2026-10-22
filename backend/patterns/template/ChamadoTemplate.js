import { chamadoChain } from "../chain/ChamadoChain.js";
import { NotificacaoManager } from "../singleton/NotificacaoManager.js";
export class ChamadoTemplate {
  constructor() {
    this.notificacoes = NotificacaoManager.getInstance();
  }
  async executar(context, persistir) {
    await chamadoChain().handle(context);
    const id = await persistir(context.data);
    await this.notificacoes.paraMorador(
      context.connection,
      context.data.morador_id,
      this.titulo(),
      context.data.titulo,
    );
    return id;
  }
  titulo() {
    throw new Error("Defina o título na subclasse.");
  }
}
export class ChamadoManutencao extends ChamadoTemplate {
  titulo() {
    return "Manutenção registrada";
  }
}
export class ChamadoOcorrencia extends ChamadoTemplate {
  titulo() {
    return "Ocorrência registrada";
  }
}
