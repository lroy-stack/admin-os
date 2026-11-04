import { z } from "zod";

/** A field of a showcase window form: a label, a kind and, for a select, its options. Values are always text. */
export interface ShowcaseField {
  readonly name: string;
  readonly label: string;
  readonly kind: "text" | "number" | "date" | "time" | "select" | "textarea";
  readonly required?: boolean;
  readonly options?: readonly { readonly value: string; readonly label: string }[];
}

/** The two sentences the schema reports, already translated. */
export interface ShowcaseFormErrors {
  readonly required: string;
  /** Only needed when a field is a number. */
  readonly numberInvalid?: string;
}

export type ShowcaseValues = Record<string, string>;

/** A blank form: empty text, and the first option of every select. */
export function emptyShowcaseValues(fields: readonly ShowcaseField[]): ShowcaseValues {
  return Object.fromEntries(fields.map((field) => [field.name, field.options?.[0]?.value ?? ""]));
}

function fieldSchema(field: ShowcaseField, errors: ShowcaseFormErrors) {
  const text = z.string().trim();
  const required = field.required === true ? text.min(1, errors.required) : text;
  if (field.kind !== "number") return required;
  return required.refine((value) => value === "" || (Number.isFinite(Number(value)) && Number(value) >= 0), {
    message: errors.numberInvalid ?? errors.required,
  });
}

/** Required fields must not be blank; numbers must be zero or more. Whitespace is trimmed from every value. */
export function showcaseFormSchema(fields: readonly ShowcaseField[], errors: ShowcaseFormErrors) {
  return z.object(Object.fromEntries(fields.map((field) => [field.name, fieldSchema(field, errors)])));
}
