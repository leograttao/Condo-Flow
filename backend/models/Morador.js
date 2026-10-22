import { Entidade } from "./Entidade.js";
export class Morador extends Entidade {
  constructor(data) {
    super(data);
    this.unidade_id = data.unidade_id;
    this.nome = data.nome;
    this.email = data.email;
    this.telefone = data.telefone;
  }
  validar() {
    this.exigir(this.nome.length >= 3, "Informe o nome completo do morador.");
  }
  contato() {
    return `${this.nome} <${this.email}>`;
  }
}
