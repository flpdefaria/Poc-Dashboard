/**
 * pt-BR noun for an entity, used by the CRUD composables to build toasts and fallback error
 * messages with the right gender and plural ("Marca excluída", "2 carros excluídos").
 */
export interface EntityLabel {
  /** Lower-case singular noun, e.g. "carro". */
  singular: string;
  /** Lower-case plural noun, e.g. "carros". */
  plural: string;
  /** Grammatical gender: drives the article and past-participle endings. */
  feminine?: boolean;
}

export const carLabel: EntityLabel = { singular: "carro", plural: "carros" };
export const brandLabel: EntityLabel = { singular: "marca", plural: "marcas", feminine: true };
export const customerLabel: EntityLabel = { singular: "cliente", plural: "clientes" };

/** "o"/"a" (or "os"/"as"): article, and the ending of an agreeing participle ("excluíd" + "o"). */
export function genderSuffix(label: EntityLabel, plural = false): string {
  return (label.feminine ? "a" : "o") + (plural ? "s" : "");
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Fallback when the API returns no `{ message }` body. */
export function requestFailedMessage(status: number): string {
  return `A requisição falhou (status ${status}).`;
}
