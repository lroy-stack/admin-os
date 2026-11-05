import { normalisePhone } from "@/core/text";

import type { Customer } from "./schema";

/** Shared with every form that takes a phone (`@/core/text`). */
export { normalisePhone };

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
