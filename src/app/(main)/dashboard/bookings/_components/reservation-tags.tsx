import type { Tone } from "@/ds/components";
import { TonePill } from "@/ds/components";

/** Dietary needs read in salmon, loyalty in azure, everything else stays neutral. */
function tagTone(tag: string): Tone {
  if (/free|allerg/i.test(tag)) return "salmon";
  if (/regular/i.test(tag)) return "azure";
  return "neutral";
}

export function ReservationTags({ tags }: { tags: readonly string[] }) {
  if (tags.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1" aria-label="Notes">
      {tags.map((tag) => (
        <li key={tag}>
          <TonePill tone={tagTone(tag)} className="px-1.5 text-[11px]">
            {tag}
          </TonePill>
        </li>
      ))}
    </ul>
  );
}
