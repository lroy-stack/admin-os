"use client";

import { useCallback, useEffect, useState } from "react";

import type { Availability } from "@/modules/bookings";

import type { AvailabilityAnswer } from "./new-reservation-slots";

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** What the Time field shows: nothing to ask yet, waiting, a refusal or failure with its text, or the day's slots. */
export type AvailabilityState =
  | { readonly status: "idle" }
  | { readonly status: "loading" }
  | { readonly status: "error"; readonly text: string | null }
  | { readonly status: "ready"; readonly slots: Availability["slots"] };

export type LoadAvailability = (input: { businessDay: string; partySize: number }) => Promise<AvailabilityAnswer>;

/**
 * The slots of `date` for a party of `covers`, asked again whenever either changes. Only the answer to the latest
 * question is kept, and while a newer one is unanswered the field shows loading rather than a stale list. `retry` asks
 * the same question again after a failure.
 */
export function useAvailability(
  date: string,
  covers: number,
  load: LoadAvailability,
): AvailabilityState & { retry: () => void } {
  const [attempt, setAttempt] = useState(0);
  const [answer, setAnswer] = useState<{ key: string; value: AvailabilityState } | null>(null);
  const asking = DAY.test(date);
  const key = `${date}|${covers}|${attempt}`;

  useEffect(() => {
    if (!asking) return;
    let current = true;
    load({ businessDay: date, partySize: covers })
      .then((found) => {
        if (current)
          setAnswer({
            key,
            value:
              found.status === "ok" ? { status: "ready", slots: found.slots } : { status: "error", text: found.text },
          });
      })
      .catch(() => {
        if (current) setAnswer({ key, value: { status: "error", text: null } });
      });
    return () => {
      current = false;
    };
  }, [asking, date, covers, key, load]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);
  if (!asking) return { status: "idle", retry };
  return { ...(answer?.key === key ? answer.value : { status: "loading" as const }), retry };
}
