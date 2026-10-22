import { Entidade } from "./Entidade.js";
export class Prestador extends Entidade {
  constructor(data) {
    super(data);
    this.nome = data.nome;
    this.especialidade = data.especialidade;
    this.email = data.email;
    this.telefone = data.telefone;
    this.documento = data.documento;
    this.contrato = data.contrato;
  }
  validar() {
    this.exigir(
      this.especialidade.length >= 3,
      "Informe a especialidade do prestador.",
    );
  }
  apresentacao() {
    return `${this.nome} • ${this.especialidade}`;
  }
}
