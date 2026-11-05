"use client";

import { createContext, type ReactNode, useContext, useOptimistic, useTransition } from "react";

import { toast } from "sonner";

import { format, useLocale, useMessages } from "@/core/i18n/client";
import { useToastWithUndo } from "@/ds/feedback";
import { type CapabilityActionOptions, failureMessage, useCapabilityAction } from "@/ds/forms";

import { advanceStatus, undoStatus } from "../actions";
import type { BookingAbilities } from "./abilities";
import { bookingsMessageKey } from "./messages";
import { guestName, tableLabel } from "./reservation-status";
import { bookingStatusFor, type Reservation, type ReservationStatus, withStatus } from "./view-model";

/** What the controls of the screen need to write: the role's abilities, the error texts and whether a write is open. */
export interface BookingWritesValue {
  readonly can: BookingAbilities;
  readonly errors: CapabilityActionOptions["errors"];
  /** A step is saving; the step controls wait so two writes never race. */
  readonly busy: boolean;
}

const BookingWritesContext = createContext<BookingWritesValue | null>(null);

export function BookingWritesProvider({ value, children }: { value: BookingWritesValue; children: ReactNode }) {
  return <BookingWritesContext.Provider value={value}>{children}</BookingWritesContext.Provider>;
}

export function useBookingWrites(): BookingWritesValue {
  const value = useContext(BookingWritesContext);
  if (value === null) throw new Error("useBookingWrites must be used inside BookingWritesProvider");
  return value;
}

/**
 * Confirm, Seat and Complete (plan 003, B3, BK4): the day's reservations with the step shown at once, and `advance`,
 * which writes it through `bookings.status.advance`. When the write fails the step rolls back and the server's text is
 * toasted; when it lands the page has already refreshed and a toast offers to take the step back for the undo window.
 */
export function useStatusWrites(loaded: Reservation[], errors: CapabilityActionOptions["errors"]) {
  const text = useMessages(bookingsMessageKey);
  const locale = useLocale();
  const [reservations, showStep] = useOptimistic(loaded, withStatus);
  const [settling, startTransition] = useTransition();
  const advance = useCapabilityAction(advanceStatus, errors === undefined ? {} : { errors });
  const undo = useCapabilityAction(undoStatus, errors === undefined ? {} : { errors });
  const toastWithUndo = useToastWithUndo();

  const stepMessage = (reservation: Reservation, to: ReservationStatus) => {
    const guest = guestName(reservation, text);
    if (to === "seated") return format(text.writes.seated, locale, { guest, table: tableLabel(reservation) });
    return format(to === "confirmed" ? text.writes.confirmed : text.writes.completed, locale, { guest });
  };

  const takeBack = async (id: string) => {
    const outcome = await undo.run({ id });
    if (outcome?.status !== "ok") throw new Error(outcome === null ? "busy" : failureMessage(outcome, "undo failed"));
  };

  function advanceReservation(reservation: Reservation, to: ReservationStatus) {
    startTransition(async () => {
      showStep({ id: reservation.id, status: to });
      const outcome = await advance.run({ id: reservation.id, to: bookingStatusFor(to) });
      if (outcome === null) return;
      if (outcome.status === "ok") {
        toastWithUndo({ message: stepMessage(reservation, to), undo: () => takeBack(reservation.id) });
        return;
      }
      toast.error(failureMessage(outcome, text.writes.failed));
    });
  }

  return { reservations, advance: advanceReservation, busy: advance.pending || undo.pending || settling };
}
