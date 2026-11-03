import { format, formatTime, type Locale } from "@/core/i18n/client";
import type { Tone } from "@/ds/components";

import type { BookingsMessages } from "./messages";
import { LATE_AFTER_MIN, SERVICE_NOW_MIN } from "./reservations-data";
import type { Reservation, ReservationStatus } from "./view-model";

export const statusTones: Record<ReservationStatus, Tone> = {
  pending: "salmon",
  confirmed: "azure",
  seated: "brand",
  completed: "neutral",
  cancelled: "neutral",
  no_show: "salmon",
};

const ACTIVE_STATUSES: readonly ReservationStatus[] = ["pending", "confirmed", "seated"];

export function isActive(reservation: Reservation) {
  return ACTIVE_STATUSES.includes(reservation.status);
}

export type NextAction = { kind: "confirm" | "seat" | "complete"; to: ReservationStatus };

/** The one forward step offered for each status; null when the reservation is finished or needs a table first. */
export function nextAction(reservation: Reservation): NextAction | null {
  switch (reservation.status) {
    case "pending":
      return { kind: "confirm", to: "confirmed" };
    case "confirmed":
      return reservation.tableIds.length > 0 ? { kind: "seat", to: "seated" } : null;
    case "seated":
      return { kind: "complete", to: "completed" };
    case "completed":
    case "cancelled":
    case "no_show":
      return null;
    default: {
      const unreachable: never = reservation.status;
      return unreachable;
    }
  }
}

export function minutesLate(reservation: Reservation, nowMin = SERVICE_NOW_MIN) {
  return reservation.status === "confirmed" ? Math.max(0, nowMin - reservation.startMin) : 0;
}

export function isLate(reservation: Reservation, nowMin = SERVICE_NOW_MIN, lateAfterMin = LATE_AFTER_MIN) {
  return minutesLate(reservation, nowMin) >= lateAfterMin;
}

export function isUnassigned(reservation: Reservation) {
  return isActive(reservation) && reservation.tableIds.length === 0;
}

export function tableLabel(reservation: Reservation) {
  return reservation.tableLabels.join("+");
}

/** The label of a forward step, for example "Seat at T4". */
export function actionLabel(action: NextAction, reservation: Reservation, text: BookingsMessages, locale: Locale) {
  return action.kind === "seat"
    ? format(text.nextAction.seat, locale, { table: tableLabel(reservation) })
    : text.nextAction[action.kind];
}

/** The name on a reservation: a surname is data; a walk-in has none and is named in the active language. */
export function guestName(reservation: Reservation, text: BookingsMessages) {
  return reservation.guest || text.walkInGuest;
}

/** A time of day from minutes after midnight, written as the locale writes it; 24:00 reads as midnight. */
export function formatClock(minutes: number, locale: Locale) {
  return formatTime(new Date(Date.UTC(2026, 0, 1, 0, minutes)), locale, "UTC", { hour: "numeric", minute: "2-digit" });
}
