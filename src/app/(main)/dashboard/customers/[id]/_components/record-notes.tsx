import { format, formatDateTime, type Locale } from "@/core/i18n/client";
import { ReadState } from "@/ds/feedback";
import type { CustomerNote } from "@/modules/customers";

import type { CustomerRecordMessages } from "./messages";
import { newestFirst, noteMoment } from "./record-model";

/** The staff notes, newest first; the business day and minute are wall-clock time, so they are formatted in UTC. */
export function RecordNotes({
  notes,
  text,
  locale,
}: {
  notes: readonly CustomerNote[];
  text: CustomerRecordMessages["notes"];
  locale: Locale;
}) {
  return (
    <ReadState
      state={{ status: notes.length === 0 ? "empty" : "ready" }}
      emptyTitle={text.emptyTitle}
      emptyDescription={text.emptyDescription}
    >
      <ul className="divide-border flex flex-col divide-y">
        {newestFirst(notes).map((note) => (
          <li key={note.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
            <p className="text-sm break-words whitespace-pre-wrap">{note.text}</p>
            <p className="text-muted-foreground text-xs">
              {format(text.byline, locale, {
                name: note.authorName,
                when: formatDateTime(noteMoment(note), locale, "UTC"),
              })}
            </p>
          </li>
        ))}
      </ul>
    </ReadState>
  );
}
