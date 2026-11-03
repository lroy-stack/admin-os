"use client";

import { useEffect, useState } from "react";

import { type DuplicateMatch, type DuplicateQuery, queryKey } from "./duplicate-model";

/** How long the phone and email must rest before they are looked up. */
export const DUPLICATE_CHECK_DELAY_MS = 400;

export type DuplicateCheck = (query: DuplicateQuery) => Promise<DuplicateMatch[]>;

/**
 * The existing contacts that share the phone or email being typed. The look-up waits for typing to rest, only the
 * answer to the latest query is kept, and while a newer query is unanswered nothing is shown rather than a stale
 * notice. A look-up that fails shows nothing: the notice is advice and `customers.create` still refuses a duplicate.
 */
export function useDuplicateMatches(
  query: DuplicateQuery | null,
  check: DuplicateCheck,
  delayMs: number = DUPLICATE_CHECK_DELAY_MS,
): readonly DuplicateMatch[] {
  const key = queryKey(query);
  const [answer, setAnswer] = useState<{ key: string; matches: readonly DuplicateMatch[] }>({ key: "", matches: [] });

  useEffect(() => {
    if (key === "") return;
    const asked: DuplicateQuery = JSON.parse(key);
    let current = true;
    const timer = setTimeout(() => {
      check(asked)
        .then((matches) => {
          if (current) setAnswer({ key, matches });
        })
        .catch(() => {
          if (current) setAnswer({ key, matches: [] });
        });
    }, delayMs);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [key, check, delayMs]);

  return answer.key === key ? answer.matches : [];
}
