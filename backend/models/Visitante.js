import { Entidade } from "./Entidade.js";
export class Visitante extends Entidade {
  constructor(data) {
    super(data);
    this.morador_id = data.morador_id;
    this.nome = data.nome;
    this.documento = data.documento;
    this.inicio = data.inicio;
    this.fim = data.fim;
  }
  validar() {
    this.exigir(this.nome.length >= 3, "Informe o nome do visitante.");
  }
  dentroDaValidade(agora = new Date()) {
    return agora >= new Date(this.inicio) && agora <= new Date(this.fim);
  }
}
