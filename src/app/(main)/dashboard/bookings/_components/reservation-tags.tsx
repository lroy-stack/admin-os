"use client";

import { useMessages } from "@/core/i18n/client";
import { TonePill } from "@/ds/components";

import { bookingsMessageKey } from "./messages";

/** The labels staff or the guest put on a booking, shown as written: they are data, not dictionary text. */
export function ReservationTags({ tags }: { tags: readonly string[] }) {
  const text = useMessages(bookingsMessageKey);
  if (tags.length === 0) return null;
  return (
    <ul className="flex min-w-0 flex-wrap gap-1" aria-label={text.tagsLabel}>
      {tags.map((tag) => (
        <li key={tag} className="min-w-0">
          <TonePill tone="neutral" className="max-w-full px-1.5 text-[11px]">
            <span className="truncate" title={tag}>
              {tag}
            </span>
          </TonePill>
        </li>
      ))}
    </ul>
  );
}
