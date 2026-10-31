"use client";

import { useEffect, useRef } from "react";

import { cn } from "cn";
import { ChevronDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TonePill } from "@/ds/components";

import { formatClock, isLate, minutesLate, statusTones, tableLabel } from "../reservation-status";
import { ReservationTags } from "../reservation-tags";
import type { Reservation } from "../reservations-data";
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
  const late = isLate(reservation);
  return (
    <Item
      asChild
      size="xs"
      className={cn("rounded-xl text-left hover:bg-foreground/8", selected && "bg-foreground/12 ring-1 ring-brand/60")}
    >
      <button type="button" aria-pressed={selected} onClick={() => onSelect(reservation)}>
        <ItemMedia>
          <TonePill tone={statusTones[reservation.status]} className="h-7 min-w-7 justify-center px-1.5 tabular-nums">
            {reservation.partySize}
          </TonePill>
        </ItemMedia>
        <ItemContent className="min-w-0 gap-0.5">
          <ItemTitle className="truncate font-normal">{reservation.guest}</ItemTitle>
          <ItemDescription className="flex items-center gap-1.5 text-[11px]">
            <span className="tabular-nums">{formatClock(reservation.startMin)}</span>
            {late && <span className="text-foreground">+{minutesLate(reservation)}'</span>}
          </ItemDescription>
          <ReservationTags tags={reservation.tags} />
        </ItemContent>
        <ItemActions>
          {reservation.tableIds.length > 0 ? (
            <Badge variant="outline" className="tabular-nums">
              {tableLabel(reservation)}
            </Badge>
          ) : (
            <TonePill tone="salmon">Assign</TonePill>
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
          <Collapsible className="rounded-xl bg-foreground/4">
            <CollapsibleTrigger className="group/fold flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
              <span>
                Before {formatClock(plan.folded.untilMin)} · {plan.folded.rows.length} reservations
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
                "group/slot sticky top-0 z-[1] flex w-full flex-col gap-1.5 rounded-xl bg-popover px-3 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring",
                slot.isNow && "ring-1 ring-brand/50",
              )}
            >
              <span className="flex w-full items-center gap-2">
                <span className="font-medium tabular-nums">{formatClock(slot.startMin)}</span>
                {slot.isNow && <Badge className="h-4 px-1.5 text-[10px]">Now</Badge>}
                <span className="text-[11px] text-muted-foreground">
                  {slot.arrivals > 0
                    ? `${slot.arrivals} ${slot.arrivals === 1 ? "arrival" : "arrivals"} · ${slot.guests} guests`
                    : "No arrivals"}
                </span>
                <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">{slot.freeSeats} free</span>
                <ChevronDown className="size-3.5 text-muted-foreground transition-transform group-data-[state=open]/slot:rotate-180" />
              </span>
              <Progress
                value={Math.round(slot.occupancy * 100)}
                aria-label={`${Math.round(slot.occupancy * 100)}% of seats taken`}
                className={cn("h-1 bg-foreground/10", loadIndicator[slot.load])}
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
