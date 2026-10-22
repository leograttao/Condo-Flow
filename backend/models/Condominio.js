import { Entidade } from "./Entidade.js";
export class Condominio extends Entidade {
  constructor(data) {
    super(data);
    this.nome = data.nome;
    this.endereco = data.endereco;
    this.telefone = data.telefone;
    this.limite_reservas = data.limite_reservas;
  }
  validar() {
    this.exigir(
      this.nome.length >= 3,
      "O nome do condomínio deve ter pelo menos 3 letras.",
    );
  }
  podeReservar(quantidade) {
    return quantidade < this.limite_reservas;
  }
}
