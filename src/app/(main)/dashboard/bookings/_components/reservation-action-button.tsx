"use client";

import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { useLocale, useMessages } from "@/core/i18n/client";

import { useBookingWrites } from "./booking-writes";
import { bookingsMessageKey } from "./messages";
import { actionLabel, nextAction } from "./reservation-status";
import type { Reservation, ReservationStatus } from "./view-model";

export type AdvanceReservation = (id: string, to: ReservationStatus) => void;

/** The single forward step for a reservation (Confirm → Seat → Complete); renders nothing when none applies. */
export function ReservationActionButton({
  reservation,
  onAdvance,
  emphasis = "subtle",
}: {
  reservation: Reservation;
  onAdvance: AdvanceReservation;
  emphasis?: "subtle" | "primary";
}) {
  const text = useMessages(bookingsMessageKey);
  const locale = useLocale();
  const { can, busy } = useBookingWrites();
  const action = nextAction(reservation);
  if (!action || !can.advance) return null;

  return (
    <Button
      disabled={busy}
      variant={emphasis === "primary" ? "default" : "ghost"}
      className={cn(
        emphasis === "primary"
          ? "liquid-glass-brand h-9 rounded-full px-4"
          : "liquid-glass hover:bg-foreground/10 h-7 rounded-full px-3 text-xs",
      )}
      onClick={(event) => {
        // Rows and tiles open the reservation on click; the action must not open it too.
        event.stopPropagation();
        onAdvance(reservation.id, action.to);
      }}
    >
      {actionLabel(action, reservation, text, locale)}
    </Button>
  );
}
