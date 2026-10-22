import { modules } from "../frontend/js/schema.js";
import { requireValue } from "./errors.js";
import { models } from "./models/index.js";
// Só colunas conhecidas chegam ao SQL. Valores sempre usam placeholders (?).
export function validateData(resource, input) {
  const result = {};
  for (const field of modules[resource].fields) {
    let value = input[field.name];
    if (value === "" || value === undefined || value === null) {
      requireValue(field.optional, `Preencha: ${field.label}.`);
      result[field.name] = null;
      continue;
    }
    if (field.type === "number" || field.source) {
      value = Number(value);
      requireValue(Number.isFinite(value), `${field.label}: número inválido.`);
      if (!field.step)
        requireValue(
          Number.isInteger(value),
          `${field.label}: use um número inteiro.`,
        );
      requireValue(
        value >= (field.min ?? 1) && value <= (field.max ?? 2147483647),
        `${field.label}: valor fora do limite.`,
      );
    } else {
      requireValue(
        typeof value === "string",
        `${field.label}: valor inválido.`,
      );
      value = value.trim();
      requireValue(
        value.length > 0 &&
          value.length <= (field.type === "textarea" ? 5000 : 180),
        `${field.label}: texto vazio ou muito longo.`,
      );
      if (field.options)
        requireValue(
          Object.hasOwn(field.options, value),
          `${field.label}: opção inválida.`,
        );
      if (field.type === "email")
        requireValue(
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
          "E-mail inválido.",
        );
      if (field.type === "datetime-local") {
        requireValue(
          /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?$/.test(value) &&
            Number.isFinite(+new Date(value)),
          "Data inválida.",
        );
        value = value.replace("T", " ");
        if (value.length === 16) value += ":00";
      }
    }
    result[field.name] = value;
  }
  const entity = new models[resource](result);
  entity.validar();
  return result;
}
