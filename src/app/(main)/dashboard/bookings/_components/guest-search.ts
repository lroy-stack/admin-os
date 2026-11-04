/** Fewest characters `customers.search` accepts; a shorter query is not sent. */
export const GUEST_SEARCH_MIN = 2;

/** Rows one search shows; the panel is a picker, not a directory. */
export const GUEST_SEARCH_LIMIT = 8;

/** The concise row of a customer the panel needs to recognise the guest. */
export interface GuestRow {
  readonly id: string;
  readonly name: string;
  readonly phone: string | null;
}

export type GuestSearchAnswer =
  | { readonly status: "ok"; readonly rows: readonly GuestRow[] }
  | { readonly status: "error"; readonly text: string };

/** The query worth sending: trimmed, and null while it is too short to look up. */
export function guestQuery(typed: string): string | null {
  const text = typed.trim();
  return text.length < GUEST_SEARCH_MIN ? null : text;
}
