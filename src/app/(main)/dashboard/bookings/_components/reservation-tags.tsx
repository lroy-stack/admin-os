"use client";

import { useMessages } from "@/core/i18n/client";
import type { Tone } from "@/ds/components";
import { TonePill } from "@/ds/components";

import { bookingsMessageKey } from "./messages";
import type { TagId } from "./reservations-data";

/** Dietary needs read in salmon, loyalty in azure, everything else stays neutral. */
function tagTone(tag: TagId): Tone {
  if (tag === "glutenFree" || tag === "lactoseFree") return "salmon";
  if (tag === "regular") return "azure";
  return "neutral";
}

export function ReservationTags({ tags }: { tags: readonly TagId[] }) {
  const text = useMessages(bookingsMessageKey);
  if (tags.length === 0) return null;
  return (
    <ul className="flex min-w-0 flex-wrap gap-1" aria-label={text.tagsLabel}>
      {tags.map((tag) => (
        <li key={tag} className="min-w-0">
          <TonePill tone={tagTone(tag)} className="h-auto max-w-full px-1.5 text-[11px] whitespace-normal">
            {text.tags[tag]}
          </TonePill>
        </li>
      ))}
    </ul>
  );
}
