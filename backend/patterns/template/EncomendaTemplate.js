import { requireValue } from "../../errors.js";
import { NotificacaoManager } from "../singleton/NotificacaoManager.js";
export class EncomendaTemplate {
  constructor() {
    this.notificacoes = NotificacaoManager.getInstance();
  }
  async executar(context, persistir) {
    requireValue(
      ["porteiro", "sindico"].includes(context.user.perfil),
      "Apenas portaria e síndico registram encomendas.",
      403,
    );
    const id = await persistir(context.data);
    await this.notificacoes.paraMorador(
      context.connection,
      context.data.morador_id,
      this.titulo(),
      this.orientacao(context.data),
    );
    return id;
  }
  titulo() {
    throw new Error("Defina o título na subclasse.");
  }
  orientacao(data) {
    return `${data.descricao} está na portaria.`;
  }
}
export class EncomendaPacote extends EncomendaTemplate {
  titulo() {
    return "Sua encomenda chegou";
  }
}
export class EncomendaDocumento extends EncomendaTemplate {
  titulo() {
    return "Documento recebido";
  }
  orientacao(data) {
    return `${data.descricao} chegou. Apresente um documento de identificação na retirada.`;
  }
}
