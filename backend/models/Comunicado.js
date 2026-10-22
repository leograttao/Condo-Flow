import { Entidade } from "./Entidade.js";
export class Comunicado extends Entidade {
  constructor(data) {
    super(data);
    this.condominio_id = data.condominio_id;
    this.titulo = data.titulo;
    this.mensagem = data.mensagem;
    this.tipo = data.tipo;
    this.bloco = data.bloco;
  }
  validar() {
    this.exigir(
      this.mensagem.length >= 10,
      "Escreva uma mensagem com pelo menos 10 caracteres.",
    );
  }
  urgente() {
    return this.tipo === "urgente";
  }
}
