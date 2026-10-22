import { Entidade } from "./Entidade.js";
export class Chamado extends Entidade {
  constructor(data) {
    super(data);
    this.morador_id = data.morador_id;
    this.titulo = data.titulo;
    this.categoria = data.categoria;
    this.local = data.local;
    this.descricao = data.descricao;
    this.prioridade = data.prioridade;
    this.prestador_id = data.prestador_id;
    this.status = data.status;
    this.relato = data.relato;
  }
  validar() {
    this.exigir(
      this.descricao.length >= 10,
      "Descreva o chamado com pelo menos 10 caracteres.",
    );
  }
  concluido() {
    return this.status === "resolvido";
  }
}
