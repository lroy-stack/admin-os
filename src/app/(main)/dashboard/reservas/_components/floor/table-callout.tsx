"use client";

import { useState } from "react";

import { cn } from "cn";
import { Minus, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";

import { type AdvanceReservation, ReservationActionButton } from "../reservation-action-button";
import { formatClock } from "../reservation-status";
import { ReservationTags } from "../reservation-tags";
import type { DiningTable } from "./floor-model";
import { describeReading, type TableReading, tableStateLabels, type VisibleTableState } from "./table-state";

const swatch: Record<VisibleTableState, string> = {
  free: "bg-(--table-free) ring-1 ring-border",
  arriving: "bg-(--table-arriving)",
  seated: "bg-(--table-seated) ring-1 ring-white/40",
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
  zoneName: string;
  reading: TableReading;
  onAdvance: AdvanceReservation;
  onOpenDetails: (reservationId: string) => void;
  onSeatWalkIn: (tableId: string, partySize: number) => void;
}) {
  const [covers, setCovers] = useState(Math.min(2, table.capacity));
  const reservation = reading.reservation;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-base font-medium">{table.label}</span>
          <span className="text-xs text-muted-foreground">
            {table.capacity} seats · {zoneName}
          </span>
        </div>
        <Badge variant="outline" className="gap-1.5 font-normal">
          <span aria-hidden="true" className={cn("size-2 rounded-full", swatch[reading.state])} />
          {tableStateLabels[reading.state]}
        </Badge>
      </div>

      <p className="text-sm">{describeReading(reading)}</p>

      {reservation && (
        <div className="flex flex-col gap-2 rounded-xl bg-foreground/5 p-3 ring-1 ring-border">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-medium">{reservation.guest}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {reservation.partySize}p · {formatClock(reservation.startMin)}–{formatClock(reservation.endMin)}
            </span>
          </div>
          <ReservationTags tags={reservation.tags} />
          <div className="flex items-center gap-2">
            <ReservationActionButton reservation={reservation} onAdvance={onAdvance} emphasis="primary" />
            <Button variant="ghost" className="h-9 rounded-full px-3" onClick={() => onOpenDetails(reservation.id)}>
              Details
            </Button>
          </div>
        </div>
      )}

      {!reservation && reading.state === "free" && (
        <div className="flex items-center gap-2">
          <ButtonGroup aria-label="Guests to seat">
            <Button
              variant="outline"
              size="icon"
              aria-label="One guest fewer"
              disabled={covers <= 1}
              onClick={() => setCovers((value) => value - 1)}
            >
              <Minus />
            </Button>
            <ButtonGroupText className="min-w-9 justify-center tabular-nums">{covers}</ButtonGroupText>
            <Button
              variant="outline"
              size="icon"
              aria-label="One guest more"
              disabled={covers >= table.capacity + 2}
              onClick={() => setCovers((value) => value + 1)}
            >
              <Plus />
            </Button>
          </ButtonGroup>
          <Button className="liquid-glass-brand h-9 flex-1 rounded-full" onClick={() => onSeatWalkIn(table.id, covers)}>
            Seat {covers}
          </Button>
        </div>
      )}

      {reading.state === "blocked" && <p className="text-xs text-muted-foreground">Blocked today.</p>}
    </div>
  );
}
