import { requireValue } from "../errors.js";
export class Entidade {
  constructor(data = {}) {
    this.id = data.id || null;
  }
  exigir(condition, message) {
    requireValue(condition, message);
  }
  validar() {
    throw new Error("Implemente validar na classe da entidade.");
  }
}
