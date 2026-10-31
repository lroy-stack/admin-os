import { BookOpen, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLocale } from "@/config/locale.server";
import { format, formatCalendarDate } from "@/core/i18n/client";

import { addCalendarDays, todayIso } from "./calendar-days";
import { productivityMessages } from "./messages.server";

export async function RecentNotesCard() {
  const locale = await getLocale();
  const text = productivityMessages[locale];
  const today = todayIso();

  // "Today" and "Yesterday" by name, anything older as a short date in the locale.
  function noteDate(daysAgo: number) {
    if (daysAgo === 0) return text.notes.today;
    if (daysAgo === 1) return text.notes.yesterday;
    return formatCalendarDate(addCalendarDays(today, -daysAgo), locale, { month: "short", day: "numeric" });
  }

  const recentNotes = [
    { key: "principles", title: text.notes.items.designPrinciples, date: noteDate(0), icon: FileText },
    {
      key: "ideas",
      title: format(text.notes.items.contentIdeas, locale, {
        month: formatCalendarDate(today, locale, { month: "long" }),
      }),
      date: noteDate(1),
      icon: FileText,
    },
    { key: "lessons", title: text.notes.items.weeklyLessons, date: noteDate(4), icon: FileText },
    { key: "books", title: text.notes.items.books, date: noteDate(5), icon: BookOpen },
  ];

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle>{text.notes.title}</CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            {text.viewAll}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {recentNotes.map((note) => (
          <div key={note.key} className="flex items-start gap-4">
            <note.icon className="text-muted-foreground size-5 shrink-0" />
            <div className="min-w-0">
              <div
                className="line-clamp-2 text-sm leading-snug font-medium break-words hyphens-auto"
                title={note.title}
              >
                {note.title}
              </div>
              <div className="text-muted-foreground text-xs">{note.date}</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
