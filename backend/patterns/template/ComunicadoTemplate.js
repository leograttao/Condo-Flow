import { comunicadoChain } from "../chain/ComunicadoChain.js";
import { NotificacaoManager } from "../singleton/NotificacaoManager.js";
export class ComunicadoTemplate {
  constructor() {
    this.notificacoes = NotificacaoManager.getInstance();
  }
  // Template Method: a sequência é fixa; o conteúdo varia nas subclasses.
  async executar(context, persistir) {
    await comunicadoChain().handle(context);
    const id = await persistir(context.data);
    await this.notificacoes.paraCondominio(
      context.connection,
      context.data,
      this.titulo(),
      this.mensagem(context.data),
    );
    return id;
  }
  titulo() {
    throw new Error("Defina o título na subclasse.");
  }
  mensagem(data) {
    return data.titulo;
  }
}
export class ComunicadoGeral extends ComunicadoTemplate {
  titulo() {
    return "Novo comunicado";
  }
}
export class ComunicadoUrgente extends ComunicadoTemplate {
  titulo() {
    return "Comunicado urgente";
  }
  mensagem(data) {
    return `${data.titulo}. Abra o comunicado e confirme a leitura.`;
  }
}
