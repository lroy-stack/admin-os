"use client";

import { BookOpen, FileText } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, formatCalendarDate, useLocale, useMessages } from "@/core/i18n/client";

import { addCalendarDays, todayIso } from "./calendar-days";
import { productivityMessageKey } from "./messages";
import { useProductivity } from "./productivity-provider";
import type { Note } from "./productivity-state";

const MAX_NOTES = 5;

export function RecentNotesCard() {
  const text = useMessages(productivityMessageKey);
  const locale = useLocale();
  const { state } = useProductivity();
  const today = todayIso();

  // "Today" and "Yesterday" by name, anything older as a short date in the locale.
  function noteDate(daysAgo: number) {
    if (daysAgo === 0) return text.notes.today;
    if (daysAgo === 1) return text.notes.yesterday;
    return formatCalendarDate(addCalendarDays(today, -daysAgo), locale, { month: "short", day: "numeric" });
  }

  function noteTitle(note: Note) {
    if (note.seed === "contentIdeas") {
      return format(text.notes.items.contentIdeas, locale, {
        month: formatCalendarDate(today, locale, { month: "long" }),
      });
    }
    return note.seed ? text.notes.items[note.seed] : note.title;
  }

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle>{text.notes.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {state.notes.slice(0, MAX_NOTES).map((note) => {
          const Icon = note.seed === "books" ? BookOpen : FileText;
          return (
            <div key={note.id} className="flex items-start gap-4">
              <Icon className="text-muted-foreground size-5 shrink-0" />
              <div className="min-w-0">
                <div
                  className="line-clamp-2 text-sm leading-snug font-medium break-words hyphens-auto"
                  title={noteTitle(note)}
                >
                  {noteTitle(note)}
                </div>
                <div className="text-muted-foreground text-xs">{noteDate(note.daysAgo)}</div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
