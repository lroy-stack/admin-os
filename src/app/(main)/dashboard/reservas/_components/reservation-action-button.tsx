import { cn } from "cn";

import { Button } from "@/components/ui/button";

import { nextAction } from "./reservation-status";
import type { Reservation, ReservationStatus } from "./reservations-data";

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
  const action = nextAction(reservation);
  if (!action) return null;

  return (
    <Button
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
      {action.label}
    </Button>
  );
}
