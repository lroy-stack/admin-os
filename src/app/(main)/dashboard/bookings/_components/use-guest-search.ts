"use client";

import { useEffect, useState } from "react";

import { type GuestRow, type GuestSearchAnswer, guestQuery } from "./guest-search";

/** How long typing must rest before the guests are searched. */
export const GUEST_SEARCH_DELAY_MS = 250;

export type GuestSearchState =
  | { readonly status: "idle" }
  | { readonly status: "loading" }
  | { readonly status: "error"; readonly text: string | null }
  | { readonly status: "ready"; readonly rows: readonly GuestRow[] };

/**
 * The guests matching what is typed. The search waits for typing to rest, only the answer to the latest query is kept,
 * and while a newer one is unanswered the list shows loading rather than a stale result.
 */
export function useGuestSearch(
  typed: string,
  search: (text: string) => Promise<GuestSearchAnswer>,
  delayMs: number = GUEST_SEARCH_DELAY_MS,
): GuestSearchState {
  const query = guestQuery(typed);
  const [answer, setAnswer] = useState<{ query: string; value: GuestSearchState } | null>(null);

  useEffect(() => {
    if (query === null) return;
    let current = true;
    const timer = setTimeout(() => {
      search(query)
        .then((found) => {
          if (current)
            setAnswer({
              query,
              value:
                found.status === "ok" ? { status: "ready", rows: found.rows } : { status: "error", text: found.text },
            });
        })
        .catch(() => {
          if (current) setAnswer({ query, value: { status: "error", text: null } });
        });
    }, delayMs);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [query, search, delayMs]);

  if (query === null) return { status: "idle" };
  return answer?.query === query ? answer.value : { status: "loading" };
}
