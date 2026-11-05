import { z } from "zod";

import { normalisePhone } from "@/core/text";
import { type PartyRole, partyCreateInput, partyKinds, partyRoles } from "@/modules/parties";

import type { PartyRow } from "./directory-model";
import type { PartyDirectoryMessages } from "./messages";

/** What the form holds while a person types: text, with the address as one line per row. */
export interface PartyFormInput {
  kind: (typeof partyKinds)[number];
  legalName: string;
  tradeName: string;
  taxId: string;
  addressLines: string;
  countryCode: string;
  email: string;
  phone: string;
  roles: PartyRole[];
  notes: string;
}

/** What a valid form yields: blank optional fields are absent and the phone is E.164. */
export interface PartyFormValues {
  kind: PartyFormInput["kind"];
  legalName: string;
  tradeName?: string | undefined;
  taxId: string;
  addressLines: string[];
  countryCode: string;
  email: string;
  phone?: string | undefined;
  roles: PartyRole[];
  notes?: string | undefined;
}

export const EMPTY_PARTY: PartyFormInput = {
  kind: "company",
  legalName: "",
  tradeName: "",
  taxId: "",
  addressLines: "",
  countryCode: "ES",
  email: "",
  phone: "",
  roles: ["client"],
  notes: "",
};

const blankToUndefined = (text: string): string | undefined => (text.trim() === "" ? undefined : text.trim());

const linesOf = (address: string): string[] =>
  address
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");

/**
 * A text field whose value must pass `rule`, one of the create schema's own field schemas: the bounds and formats have
 * one source. A failure reads `message` from the dictionary instead of the schema's English default.
 */
const field = <O>(rule: z.ZodType<O>, message: string, prepare: (text: string) => unknown) =>
  z.string().transform((text, ctx): O => {
    const parsed = rule.safeParse(prepare(text));
    if (parsed.success) return parsed.data;
    ctx.issues.push({ code: "custom", message, input: text });
    return z.NEVER;
  });

/**
 * The form schema, derived from `partyCreateInput`. The phone accepts what people type and is normalised to E.164
 * before the create schema judges it; the country code is upper-cased; the address must have a line, as a full invoice
 * prints the recipient's address (RD 1619/2012, art. 6).
 */
export function partyFormSchema(
  messages: PartyDirectoryMessages["form"]["invalid"],
): z.ZodType<PartyFormValues, PartyFormInput> {
  const shape = partyCreateInput.shape;
  return z.object({
    kind: z.enum(partyKinds),
    legalName: field(shape.legalName, messages.legalName, blankToUndefined),
    tradeName: z.string().transform(blankToUndefined),
    taxId: field(shape.taxId, messages.taxId, blankToUndefined),
    addressLines: field(shape.addressLines.min(1), messages.address, linesOf),
    countryCode: field(shape.countryCode, messages.countryCode, (text) => blankToUndefined(text)?.toUpperCase()),
    email: field(shape.email, messages.email, blankToUndefined),
    phone: field(shape.phone, messages.phone, (text) => {
      const typed = blankToUndefined(text);
      return typed === undefined ? undefined : normalisePhone(typed);
    }),
    roles: z.array(z.enum(partyRoles)).min(1, messages.roles),
    notes: z.string().transform(blankToUndefined),
  });
}

/** The form of an existing party: optional fields it lacks are blank. */
export const toForm = (row: PartyRow): PartyFormInput => ({
  kind: row.kind,
  legalName: row.legalName,
  tradeName: row.tradeName ?? "",
  taxId: row.taxId,
  addressLines: row.addressLines.join("\n"),
  countryCode: row.countryCode,
  email: row.email,
  phone: row.phone ?? "",
  roles: row.roles,
  notes: row.notes ?? "",
});

/** The input of `parties.create` for a valid form: a field left blank is not sent. */
export function toCreateInput({ tradeName, phone, notes, ...required }: PartyFormValues) {
  return {
    ...required,
    ...(tradeName === undefined ? {} : { tradeName }),
    ...(phone === undefined ? {} : { phone }),
    ...(notes === undefined ? {} : { notes }),
  };
}

/** The input of `parties.update`: every field is sent, and an optional one left blank is cleared with `null`. */
export function toUpdateInput(id: string, { tradeName, phone, notes, ...required }: PartyFormValues) {
  return { id, ...required, tradeName: tradeName ?? null, phone: phone ?? null, notes: notes ?? null };
}
