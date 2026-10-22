import { Entidade } from "./Entidade.js";
export class Reserva extends Entidade {
  constructor(data) {
    super(data);
    this.area_id = data.area_id;
    this.morador_id = data.morador_id;
    this.inicio = data.inicio;
    this.fim = data.fim;
    this.convidados = data.convidados;
    this.status = data.status;
  }
  validar() {
    this.exigir(this.convidados > 0, "Informe a quantidade de pessoas.");
  }
  duracaoHoras() {
    return (new Date(this.fim) - new Date(this.inicio)) / 3600000;
  }
}
