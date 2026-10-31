import type { Tone } from "@/ds/components";

import { LATE_AFTER_MIN, type Reservation, type ReservationStatus, SERVICE_NOW_MIN } from "./reservations-data";

export const statusLabels: Record<ReservationStatus, string> = {
  pending: "To confirm",
  confirmed: "Confirmed",
  seated: "Seated",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

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

/** The one forward step offered for each status; null when the reservation is finished or needs a table first. */
export function nextAction(reservation: Reservation): { label: string; to: ReservationStatus } | null {
  switch (reservation.status) {
    case "pending":
      return { label: "Confirm", to: "confirmed" };
    case "confirmed":
      return reservation.tableIds.length > 0 ? { label: `Seat at ${tableLabel(reservation)}`, to: "seated" } : null;
    case "seated":
      return { label: "Complete", to: "completed" };
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

export function isLate(reservation: Reservation, nowMin = SERVICE_NOW_MIN) {
  return minutesLate(reservation, nowMin) >= LATE_AFTER_MIN;
}

export function isUnassigned(reservation: Reservation) {
  return isActive(reservation) && reservation.tableIds.length === 0;
}

export function tableLabel(reservation: Reservation) {
  return reservation.tableIds.join("+");
}

/** "20:40" from minutes after midnight; 24:00 reads as midnight. */
export function formatClock(minutes: number) {
  const hours = Math.floor(minutes / 60) % 24;
  return `${String(hours).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}
