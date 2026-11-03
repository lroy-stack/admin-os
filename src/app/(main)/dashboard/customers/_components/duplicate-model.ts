/** What the New contact window knows about an existing contact that shares a phone or an email with the form. */
export interface DuplicateMatch {
  readonly id: string;
  readonly name: string;
  readonly matchedOn: readonly ("phone" | "email")[];
}

/** The phone and email the form holds, in the shape of the duplicate check. */
export interface DuplicateQuery {
  readonly phone?: string;
  readonly email?: string;
}

export type DuplicateReason = "phone" | "email" | "both";

export const reasonOf = (match: DuplicateMatch): DuplicateReason =>
  match.matchedOn.length > 1 ? "both" : (match.matchedOn[0] ?? "phone");

/**
 * The directory filtered to the contact. There is no customer panel yet (plan 003, C4), so the link searches the
 * shared detail: the email when it matched, the phone otherwise, which shows the existing record.
 */
export function directoryHref(match: DuplicateMatch, query: DuplicateQuery): string {
  const detail = match.matchedOn.includes("email") ? query.email : query.phone;
  return detail === undefined ? "/dashboard/customers" : `/dashboard/customers?q=${encodeURIComponent(detail)}`;
}

/** A stable string for a query, so an effect re-runs only when the phone or email really changed. */
export const queryKey = (query: DuplicateQuery | null): string => (query === null ? "" : JSON.stringify(query));
