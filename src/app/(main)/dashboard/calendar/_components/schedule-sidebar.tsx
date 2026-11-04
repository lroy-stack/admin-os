import Link from "next/link";

import { ArrowUpRight } from "lucide-react";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import {
  format,
  formatAmount,
  formatCalendarDate,
  formatLocalDate,
  useCurrency,
  useLocale,
  useMessages,
} from "@/core/i18n/client";
import { CardIconButton } from "@/ds/components";

import { calendarMessageKey } from "./messages";

export type UpcomingEvent = { id: string; title: string; start: Date; end?: Date; allDay: boolean };

/** A deal as the sidebar shows it: the title is already in the request's locale. */
export type ClosingDeal = { id: string; title: string; company: string; value: number; closeDate: string };

function DateCapsule({ top, bottom }: { top: string; bottom: string }) {
  return (
    <span className="liquid-glass flex w-11 shrink-0 flex-col items-center rounded-2xl py-1.5 leading-none">
      <span className="text-muted-foreground text-[10px] uppercase">{top}</span>
      <span className="mt-1 text-base font-medium tabular-nums">{bottom}</span>
    </span>
  );
}

const TIME: Intl.DateTimeFormatOptions = { timeStyle: "short" };

/**
 * Item titles default to `w-fit` and one line, so a long German or French title outgrows the row and runs under the
 * amount. Here a title takes the row's width, wraps to two lines and hyphenates by the wrapper's `lang`.
 */
const LONG_TITLE = "line-clamp-2 block w-full font-normal break-words hyphens-auto";

/** Next events after "now"; `events` is null until the client clock is known, to avoid hydration drift. */
export function UpNext({
  events,
  onOpen,
}: {
  events: UpcomingEvent[] | null;
  /** Opens the event's window; `opener` is the item that asked, where focus returns. */
  onOpen: (id: string, opener: Element) => void;
}) {
  const text = useMessages(calendarMessageKey).sidebar;
  const locale = useLocale();

  function timeLabel(event: UpcomingEvent) {
    if (event.allDay) return text.allDay;
    const start = formatLocalDate(event.start, locale, TIME);
    return event.end ? format(text.timeRange, locale, { start, end: formatLocalDate(event.end, locale, TIME) }) : start;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-normal">{text.upNext}</CardTitle>
      </CardHeader>
      <CardContent>
        <ItemGroup className="gap-1">
          {events === null &&
            ["first", "second", "third"].map((key) => (
              <Item key={key} size="sm" className="px-0">
                <ItemMedia>
                  <Skeleton className="h-11 w-11 rounded-2xl" />
                </ItemMedia>
                <ItemContent>
                  <Skeleton className="h-4 w-32" />
                </ItemContent>
              </Item>
            ))}
          {events?.length === 0 && <p className="text-muted-foreground text-xs">{text.nothingScheduled}</p>}
          {events?.map((event) => (
            <li key={event.id} className="list-none">
              <Item asChild size="sm" className="hover:bg-muted/50 cursor-pointer px-0 text-left">
                <button type="button" onClick={(click) => onOpen(event.id, click.currentTarget)}>
                  <ItemMedia>
                    <DateCapsule
                      top={formatLocalDate(event.start, locale, { weekday: "short" })}
                      bottom={formatLocalDate(event.start, locale, { day: "numeric" })}
                    />
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                    <ItemTitle className={LONG_TITLE} title={event.title}>
                      {event.title}
                    </ItemTitle>
                    <ItemDescription className="text-[11px]">{timeLabel(event)}</ItemDescription>
                  </ItemContent>
                </button>
              </Item>
            </li>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}

/** Deals from the pipeline whose expected close date lands in the next 30 days. */
export function ClosingSoon({ deals }: { deals: ClosingDeal[] }) {
  const text = useMessages(calendarMessageKey).sidebar;
  const locale = useLocale();
  const currency = useCurrency();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-normal">{text.closingSoon}</CardTitle>
        <CardAction>
          <CardIconButton icon={ArrowUpRight} label={text.openPipeline} href="/dashboard/crm" />
        </CardAction>
      </CardHeader>
      <CardContent>
        <ItemGroup className="gap-1">
          {deals.map((deal) => (
            <li key={deal.id} className="list-none">
              <Item asChild size="sm" className="hover:bg-muted/50 px-0">
                <Link href="/dashboard/crm" prefetch={false}>
                  <ItemMedia>
                    <DateCapsule
                      top={formatCalendarDate(deal.closeDate, locale, { month: "short" })}
                      bottom={formatCalendarDate(deal.closeDate, locale, { day: "numeric" })}
                    />
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                    <ItemTitle className={LONG_TITLE} title={deal.title}>
                      {deal.title}
                    </ItemTitle>
                    <ItemDescription className="truncate text-[11px]">{deal.company}</ItemDescription>
                  </ItemContent>
                  <ItemActions className="shrink-0 self-start pt-0.5 text-xs tabular-nums">
                    {formatAmount(deal.value, currency, locale, { compact: true })}
                  </ItemActions>
                </Link>
              </Item>
            </li>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}
