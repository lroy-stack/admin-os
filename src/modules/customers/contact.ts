import type { Customer } from "./schema";

/**
 * Drops the spaces, dashes, dots and parentheses people type in a phone, keeping a leading `+` and the digits, and reads
 * a leading `00` international prefix as `+` (`0034 600 000 101` equals `+34600000101`). National formats (a bare
 * `600000101`, a trunk `0`) are not guessed: they stay as typed.
 */
export const normalisePhone = (phone: string): string => {
  const stripped = phone.replace(/[^\d+]/g, "");
  return stripped.startsWith("00") ? `+${stripped.slice(2)}` : stripped;
};

export interface ContactQuery {
  readonly phone?: string;
  readonly email?: string;
}

export type MatchedField = "phone" | "email";

const normaliseEmail = (email: string): string => email.trim().toLowerCase();

/** The contact details through which `customer` matches `query`; empty when it is a different contact. */
export function matchedFields(customer: Customer, query: ContactQuery): MatchedField[] {
  const samePhone =
    query.phone !== undefined &&
    customer.phone !== undefined &&
    normalisePhone(customer.phone) === normalisePhone(query.phone);
  const sameEmail =
    query.email !== undefined &&
    customer.email !== undefined &&
    normaliseEmail(customer.email) === normaliseEmail(query.email);
  return [...(samePhone ? (["phone"] as const) : []), ...(sameEmail ? (["email"] as const) : [])];
}
