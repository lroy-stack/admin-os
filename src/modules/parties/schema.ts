import { z } from "zod";

import { pageInput } from "@/core/pagination";

export const partyKinds = ["person", "company"] as const;
export const partyRoles = ["client", "supplier"] as const;

/** What a party is made of, without its id, which the store assigns, and `ext`, which only a seed carries. */
const partyFields = {
  kind: z.enum(partyKinds),
  legalName: z.string().min(1),
  tradeName: z.string().min(1).optional(),
  taxId: z.string().min(1),
  addressLines: z.array(z.string().min(1)),
  /** ISO 3166-1 alpha-2, upper case. */
  countryCode: z.string().regex(/^[A-Z]{2}$/),
  email: z.email(),
  phone: z.e164().optional(),
  /** At least one: a party that is neither a client nor a supplier has no reason to be kept. */
  roles: z.array(z.enum(partyRoles)).min(1),
  notes: z.string().min(1).optional(),
};

/**
 * A fiscal identity a business invoices or buys from (ADR 0019 §1). Never a person who books: the agenda's customers
 * stay in `customers` and the two are not linked.
 */
export const partySchema = z.object({
  id: z.string().min(1),
  ...partyFields,
  ext: z.record(z.string(), z.unknown()).optional(),
});

export const partyListInput = pageInput({ defaultLimit: 50, maxLimit: 200 }).extend({
  role: z.enum(partyRoles).optional(),
  /** Matched without case or accents in the legal name, the trade name and the tax ID. */
  text: z.string().trim().min(1).max(100).optional(),
});

/** A new party: every field of the directory. */
export const partyCreateInput = z.strictObject(partyFields);

/**
 * A change to a party: an omitted field stays as it is and `null` clears an optional one (the trade name, the phone,
 * the notes). The id never changes.
 */
export const partyUpdateInput = z.strictObject({
  id: z.string().min(1),
  kind: partyFields.kind.optional(),
  legalName: partyFields.legalName.optional(),
  tradeName: partyFields.tradeName.unwrap().nullable().optional(),
  taxId: partyFields.taxId.optional(),
  addressLines: partyFields.addressLines.optional(),
  countryCode: partyFields.countryCode.optional(),
  email: partyFields.email.optional(),
  phone: partyFields.phone.unwrap().nullable().optional(),
  roles: partyFields.roles.optional(),
  notes: partyFields.notes.unwrap().nullable().optional(),
});

export type Party = z.infer<typeof partySchema>;
export type PartyUpdateInput = z.infer<typeof partyUpdateInput>;
export type PartyRole = (typeof partyRoles)[number];
