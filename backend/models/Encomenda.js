import { Entidade } from "./Entidade.js";
export class Encomenda extends Entidade {
  constructor(data) {
    super(data);
    this.morador_id = data.morador_id;
    this.descricao = data.descricao;
    this.transportadora = data.transportadora;
    this.tipo = data.tipo;
  }
  validar() {
    this.exigir(this.descricao.length >= 3, "Descreva a encomenda.");
  }
  resumo() {
    return `${this.transportadora}: ${this.descricao}`;
  }
}
