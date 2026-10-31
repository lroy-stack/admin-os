import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLocale, getMessages } from "@/config/locale.server";
import { format, formatDate, formatTime } from "@/core/i18n/client";

import { atMinutes, type ClassStatus, classesToday, SCHOOL_CLOCK } from "./academy-data";
import { academyMessages } from "./messages.server";

const statusStyles: Record<ClassStatus, { bar: string; badge: string }> = {
  inProgress: {
    bar: "bg-green-600 dark:bg-green-400",
    badge:
      "border-green-600/50 bg-green-50 text-green-600 dark:border-green-800/50 dark:bg-green-500/10 dark:text-green-400",
  },
  upcoming: {
    bar: "bg-yellow-500 dark:bg-yellow-400",
    badge:
      "border-yellow-600/50 bg-yellow-50 text-yellow-700 dark:border-yellow-800/50 dark:bg-yellow-500/10 dark:text-yellow-300",
  },
  cancelled: {
    bar: "bg-destructive",
    badge: "border-destructive/50 bg-destructive/10 text-destructive dark:border-destructive/50 dark:bg-destructive/20",
  },
};

export async function ClassSchedule() {
  const [text, locale] = await Promise.all([getMessages(academyMessages), getLocale()]);
  const today = formatDate(new Date(), locale, SCHOOL_CLOCK.timeZone, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const clock = (minutes: number) =>
    formatTime(atMinutes(minutes), locale, "UTC", { hour: "numeric", minute: "2-digit" });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{text.schedule.title}</CardTitle>
        <CardAction className="text-muted-foreground flex items-center gap-1 text-xs">
          {text.schedule.viewFull} <ArrowRight className="size-4" aria-hidden="true" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-0">
        <div className="divide-border flex flex-col divide-y">
          {classesToday.map((item) => {
            const style = statusStyles[item.status];
            const subject = text.subjects[item.subject];
            return (
              <div
                key={item.startMin}
                className="bg-card hover:bg-muted/30 grid grid-cols-1 gap-3 py-3 transition-colors sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_auto] sm:items-center"
              >
                <div className="flex gap-2">
                  <div className={`w-1 shrink-0 rounded-md ${style.bar}`} />
                  <div className="min-w-0 text-xs">
                    <div className="text-foreground font-medium text-nowrap tabular-nums">
                      {format(text.timeRange, locale, { start: clock(item.startMin), end: clock(item.endMin) })}
                    </div>
                    <div className="text-muted-foreground break-words">{today}</div>
                  </div>
                </div>

                <div className="flex min-w-0 flex-col gap-1">
                  <div
                    className="text-foreground line-clamp-2 block w-full text-sm leading-tight font-medium break-words hyphens-auto"
                    title={subject}
                  >
                    {subject}
                  </div>
                  <div className="text-muted-foreground line-clamp-2 text-xs leading-tight break-words">
                    {format(text.schedule.classLine, locale, {
                      grade: format(text.grade, locale, { section: `11${item.section}` }),
                      room: text.rooms[item.room],
                    })}
                  </div>
                </div>

                <Badge
                  variant="secondary"
                  className={`shrink-0 justify-self-start rounded-md px-2.5 py-1 text-[10px] font-medium ${style.badge}`}
                >
                  {text.schedule.status[item.status]}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
