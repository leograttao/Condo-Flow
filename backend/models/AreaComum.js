import { Entidade } from "./Entidade.js";
export class AreaComum extends Entidade {
  constructor(data) {
    super(data);
    this.condominio_id = data.condominio_id;
    this.nome = data.nome;
    this.capacidade = data.capacidade;
    this.taxa = data.taxa;
    this.status = data.status;
  }
  validar() {
    this.exigir(this.nome.length >= 3, "Informe o nome da área comum.");
  }
  comporta(pessoas) {
    return this.status === "disponivel" && pessoas <= this.capacidade;
  }
}
