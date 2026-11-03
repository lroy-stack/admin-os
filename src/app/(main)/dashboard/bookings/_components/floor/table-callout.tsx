"use client";

import { useState } from "react";

import { cn } from "cn";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, useLocale, useMessages } from "@/core/i18n/client";

import { CoversStepper } from "../covers-stepper";
import { bookingsMessageKey } from "../messages";
import { type AdvanceReservation, ReservationActionButton } from "../reservation-action-button";
import { formatClock, guestName } from "../reservation-status";
import { ReservationTags } from "../reservation-tags";
import type { DiningTable } from "./floor-model";
import { describeReading, type TableReading, type VisibleTableState } from "./table-state";

const swatch: Record<VisibleTableState, string> = {
  free: "bg-(--table-free) ring-1 ring-border",
  arriving: "bg-(--table-arriving)",
  seated: "bg-(--table-seated)",
  leaving: "bg-(--table-leaving)",
  late: "bg-(--table-late)",
  blocked: "bg-(--table-blocked)",
};

/** What a host can do with one table: open or advance its reservation, or seat a walk-in when it is free. */
export function TableCallout({
  table,
  zoneName,
  reading,
  onAdvance,
  onOpenDetails,
  onSeatWalkIn,
}: {
  table: DiningTable;
  /** The zone's name, already in the active language. */
  zoneName: string;
  reading: TableReading;
  onAdvance: AdvanceReservation;
  onOpenDetails: (reservationId: string) => void;
  onSeatWalkIn: (tableId: string, partySize: number) => void;
}) {
  const text = useMessages(bookingsMessageKey);
  const locale = useLocale();
  const [covers, setCovers] = useState(Math.min(2, table.capacity));
  const reservation = reading.reservation;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <span className="text-base font-medium break-words">{table.label}</span>
          <span className="text-muted-foreground text-xs break-words">
            {format(text.callout.seatsInZone, locale, {
              seats: format(text.seats, locale, { count: table.capacity }),
              zone: zoneName,
            })}
          </span>
        </div>
        <Badge variant="outline" className="h-auto shrink-0 gap-1.5 font-normal whitespace-normal">
          <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", swatch[reading.state])} />
          {text.tableState[reading.state]}
        </Badge>
      </div>

      <p className="text-sm">{describeReading(reading, text, locale)}</p>

      {reservation && (
        <div className="bg-foreground/5 ring-border flex flex-col gap-2 rounded-xl p-3 ring-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="min-w-0 font-medium break-words">{guestName(reservation, text)}</span>
            <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
              {`${format(text.partyShort, locale, { count: reservation.partySize })} · ${formatClock(reservation.startMin, locale)}–${formatClock(reservation.endMin, locale)}`}
            </span>
          </div>
          <ReservationTags tags={reservation.tags} />
          <div className="flex flex-wrap items-center gap-2">
            <ReservationActionButton reservation={reservation} onAdvance={onAdvance} emphasis="primary" />
            <Button variant="ghost" className="h-9 rounded-full px-3" onClick={() => onOpenDetails(reservation.id)}>
              {text.callout.details}
            </Button>
          </div>
        </div>
      )}

      {!reservation && reading.state === "free" && (
        <div className="flex items-center gap-2">
          <CoversStepper
            value={covers}
            onChange={setCovers}
            max={table.capacity + 2}
            label={text.callout.guestsToSeat}
          />
          <Button
            className="liquid-glass-brand h-auto min-h-9 min-w-0 flex-1 rounded-full px-3 py-1.5 whitespace-normal"
            onClick={() => onSeatWalkIn(table.id, covers)}
          >
            {format(text.callout.seat, locale, { count: covers })}
          </Button>
        </div>
      )}

      {reading.state === "blocked" && <p className="text-muted-foreground text-xs">{text.reading.blockedToday}</p>}
    </div>
  );
}
