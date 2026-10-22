import { Entidade } from "./Entidade.js";
export class Unidade extends Entidade {
  constructor(data) {
    super(data);
    this.condominio_id = data.condominio_id;
    this.bloco = data.bloco;
    this.numero = data.numero;
    this.andar = data.andar;
  }
  validar() {
    this.exigir(this.bloco && this.numero, "Informe bloco e apartamento.");
  }
  identificacao() {
    return `Bloco ${this.bloco} • Apto ${this.numero}`;
  }
}
