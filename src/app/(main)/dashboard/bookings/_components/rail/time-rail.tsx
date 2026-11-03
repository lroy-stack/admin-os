"use client";

import { useEffect, useRef } from "react";

import { cn } from "cn";
import { ChevronDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, formatPercent, useLocale, useMessages } from "@/core/i18n/client";
import { TonePill } from "@/ds/components";

import { bookingsMessageKey } from "../messages";
import { formatClock, guestName, isLate, minutesLate, statusTones, tableLabel } from "../reservation-status";
import { ReservationTags } from "../reservation-tags";
import type { Reservation } from "../view-model";
import type { RailLoad, RailPlan } from "./rail-plan";

const loadIndicator: Record<RailLoad, string> = {
  calm: "[&_[data-slot=progress-indicator]]:bg-brand",
  busy: "[&_[data-slot=progress-indicator]]:bg-azure",
  full: "[&_[data-slot=progress-indicator]]:bg-salmon",
};

function RailRow({
  reservation,
  selected,
  onSelect,
}: {
  reservation: Reservation;
  selected: boolean;
  onSelect: (reservation: Reservation) => void;
}) {
  const text = useMessages(bookingsMessageKey);
  const locale = useLocale();
  const late = isLate(reservation);
  return (
    <Item
      asChild
      size="xs"
      className={cn("hover:bg-foreground/8 rounded-xl text-left", selected && "bg-foreground/12 ring-brand/60 ring-1")}
    >
      <button type="button" aria-pressed={selected} onClick={() => onSelect(reservation)}>
        <ItemMedia>
          <TonePill tone={statusTones[reservation.status]} className="h-7 min-w-7 justify-center px-1.5 tabular-nums">
            {reservation.partySize}
          </TonePill>
        </ItemMedia>
        <ItemContent className="min-w-0 gap-0.5">
          <ItemTitle
            className="line-clamp-2 block w-full font-normal break-words hyphens-auto"
            title={guestName(reservation, text)}
          >
            {guestName(reservation, text)}
          </ItemTitle>
          <ItemDescription className="flex items-center gap-1.5 text-[11px]">
            <span className="tabular-nums">{formatClock(reservation.startMin, locale)}</span>
            {late && (
              <span className="text-foreground tabular-nums">
                {format(text.late.short, locale, { minutes: minutesLate(reservation) })}
              </span>
            )}
          </ItemDescription>
          <ReservationTags tags={reservation.tags} />
        </ItemContent>
        <ItemActions className="shrink-0 self-start">
          {reservation.tableIds.length > 0 ? (
            <Badge variant="outline" className="tabular-nums">
              {tableLabel(reservation)}
            </Badge>
          ) : (
            <TonePill tone="salmon">{text.rail.assign}</TonePill>
          )}
        </ItemActions>
      </button>
    </Item>
  );
}

/** Lateral time rail: 15-minute slots with arrivals, free seats and load; past slots fold away. */
export function TimeRail({
  plan,
  selectedReservationId,
  onSelect,
  className,
}: {
  plan: RailPlan;
  selectedReservationId: string | null;
  onSelect: (reservation: Reservation) => void;
  className?: string;
}) {
  const text = useMessages(bookingsMessageKey);
  const locale = useLocale();
  const rootRef = useRef<HTMLDivElement>(null);
  const nowRef = useRef<HTMLDivElement>(null);

  // Start the rail at "now": scroll the viewport itself so the page does not jump.
  useEffect(() => {
    const viewport = rootRef.current?.querySelector<HTMLElement>("[data-slot=scroll-area-viewport]");
    const now = nowRef.current;
    if (viewport && now) viewport.scrollTop = Math.max(0, now.offsetTop - 8);
  }, []);

  return (
    <ScrollArea ref={rootRef} className={cn("min-h-0", className)}>
      <div className="flex flex-col gap-1 p-2">
        {plan.folded && (
          <Collapsible className="bg-foreground/4 rounded-xl">
            <CollapsibleTrigger className="group/fold text-muted-foreground hover:text-foreground focus-visible:ring-ring flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs outline-none focus-visible:ring-2">
              <span className="min-w-0 text-left">
                {format(text.rail.before, locale, {
                  time: formatClock(plan.folded.untilMin, locale),
                  count: plan.folded.rows.length,
                })}
              </span>
              <ChevronDown className="size-3.5 transition-transform group-data-[state=open]/fold:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ItemGroup className="gap-0.5 px-1 pb-1">
                {plan.folded.rows.map((reservation) => (
                  <RailRow
                    key={reservation.id}
                    reservation={reservation}
                    selected={reservation.id === selectedReservationId}
                    onSelect={onSelect}
                  />
                ))}
              </ItemGroup>
            </CollapsibleContent>
          </Collapsible>
        )}

        {plan.slots.map((slot) => (
          <Collapsible key={slot.startMin} defaultOpen={slot.open} ref={slot.isNow ? nowRef : undefined}>
            <CollapsibleTrigger
              className={cn(
                "group/slot bg-popover focus-visible:ring-ring sticky top-0 z-[1] flex w-full flex-col gap-1.5 rounded-xl px-3 py-2 text-left outline-none focus-visible:ring-2",
                slot.isNow && "ring-brand/50 ring-1",
              )}
            >
              <span className="flex w-full items-center gap-2">
                <span className="shrink-0 font-medium tabular-nums">{formatClock(slot.startMin, locale)}</span>
                {slot.isNow && <Badge className="h-4 shrink-0 px-1.5 text-[10px]">{text.rail.now}</Badge>}
                <span className="text-muted-foreground min-w-0 text-[11px]">
                  {slot.arrivals > 0
                    ? format(text.rail.slotLine, locale, {
                        arrivals: format(text.rail.arrivals, locale, { count: slot.arrivals }),
                        guests: format(text.party, locale, { count: slot.guests }),
                      })
                    : text.rail.noArrivals}
                </span>
                <span className="text-muted-foreground ml-auto shrink-0 text-[11px] tabular-nums">
                  {format(text.rail.free, locale, { count: slot.freeSeats })}
                </span>
                <ChevronDown className="text-muted-foreground size-3.5 shrink-0 transition-transform group-data-[state=open]/slot:rotate-180" />
              </span>
              <Progress
                value={Math.round(slot.occupancy * 100)}
                aria-label={format(text.rail.occupancy, locale, { percent: formatPercent(slot.occupancy, locale) })}
                className={cn("bg-foreground/10 h-1", loadIndicator[slot.load])}
              />
            </CollapsibleTrigger>
            {slot.rows.length > 0 && (
              <CollapsibleContent>
                <ItemGroup className="gap-0.5 px-1 pt-1 pb-1.5">
                  {slot.rows.map((reservation) => (
                    <RailRow
                      key={reservation.id}
                      reservation={reservation}
                      selected={reservation.id === selectedReservationId}
                      onSelect={onSelect}
                    />
                  ))}
                </ItemGroup>
              </CollapsibleContent>
            )}
          </Collapsible>
        ))}
      </div>
    </ScrollArea>
  );
}
