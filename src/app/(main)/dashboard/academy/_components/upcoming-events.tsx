import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLocale, getMessages } from "@/config/locale.server";
import { liveClock } from "@/core/clock";
import { format, formatCalendarDate, formatTime } from "@/core/i18n/client";

import { addDays, atMinutes, SCHOOL_CLOCK, upcomingEvents } from "./academy-data";
import { academyMessages } from "./messages.server";

export async function UpcomingEvents() {
  const [text, locale] = await Promise.all([getMessages(academyMessages), getLocale()]);
  const today = liveClock(SCHOOL_CLOCK, new Date()).today;
  const clock = (minutes: number) =>
    formatTime(atMinutes(minutes), locale, "UTC", { hour: "numeric", minute: "2-digit" });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{text.events.title}</CardTitle>
        <CardAction className="text-muted-foreground flex items-center gap-1 text-xs">
          {text.events.viewCalendar} <ArrowRight className="size-4" aria-hidden="true" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {upcomingEvents.map((event) => {
          const eventDay = addDays(today, event.dayOffset);
          const title = text.events.items[event.id];

          return (
            <div key={event.id} className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-2">
                <div className="size-11 shrink-0 overflow-hidden rounded-sm border">
                  <div className="bg-muted grid h-1/3 place-items-center border-b text-[10px] leading-none font-medium uppercase">
                    {formatCalendarDate(eventDay, locale, { month: "short" })}
                  </div>
                  <div className="grid h-2/3 place-items-center text-lg leading-none tabular-nums">
                    {formatCalendarDate(eventDay, locale, { day: "numeric" })}
                  </div>
                </div>

                <div className="flex min-w-0 flex-col gap-1">
                  <div
                    className="line-clamp-2 block w-full text-sm leading-tight font-medium break-words hyphens-auto"
                    title={title}
                  >
                    {title}
                  </div>
                  <div className="text-muted-foreground text-xs leading-tight tabular-nums">
                    {format(text.timeRange, locale, { start: clock(event.startMin), end: clock(event.endMin) })}
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="shrink-0 rounded-md px-2.5 py-1 text-[10px] font-medium">
                {text.events.types[event.type]}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
