import { isActive, isLate, isUnassigned } from "../reservation-status";
import type { Reservation } from "../view-model";

export const SLOT_MINUTES = 15;
/** Slots from now to this many minutes ahead open by default. */
export const OPEN_AHEAD_MIN = 60;

export type RailLoad = "calm" | "busy" | "full";

export type RailSlot = {
  startMin: number;
  isNow: boolean;
  open: boolean;
  rows: Reservation[];
  arrivals: number;
  guests: number;
  freeSeats: number;
  load: RailLoad;
  /** Share of seats taken at the slot start, 0–1. */
  occupancy: number;
};

export type RailPlan = { folded: { untilMin: number; rows: Reservation[] } | null; slots: RailSlot[] };

export function slotOf(startMin: number, windowStartMin: number, slotMinutes = SLOT_MINUTES) {
  return windowStartMin + Math.floor((startMin - windowStartMin) / slotMinutes) * slotMinutes;
}

/** Load thresholds on occupancy, common pacing bands: calm < 35 %, busy < 70 %, full above. */
export function loadOf(occupancy: number): RailLoad {
  if (occupancy >= 0.7) return "full";
  if (occupancy >= 0.35) return "busy";
  return "calm";
}

/** A reservation needs the host's attention while it is late, unassigned or unconfirmed. */
function needsAttention(reservation: Reservation, nowMin: number) {
  return isLate(reservation, nowMin) || isUnassigned(reservation) || reservation.status === "pending";
}

/**
 * Plans the time rail: 15-minute slots across the service. Past slots fold into one group, except rows that still
 * need attention. Open by default: now to now + 60 min and slots that need attention. Rows come from
 * `reservations` (which may be filtered); load and free seats always count every booking of the day in `seatHolders`.
 */
export function planRail({
  reservations,
  seatHolders = reservations,
  nowMin,
  windowStartMin,
  windowEndMin,
  totalSeats,
  slotMinutes = SLOT_MINUTES,
}: {
  reservations: readonly Reservation[];
  seatHolders?: readonly Reservation[];
  nowMin: number;
  windowStartMin: number;
  windowEndMin: number;
  totalSeats: number;
  slotMinutes?: number;
}): RailPlan {
  const active = reservations.filter(isActive).sort((a, b) => a.startMin - b.startMin);
  const holding = seatHolders.filter(isActive);
  const nowSlot = slotOf(nowMin, windowStartMin, slotMinutes);

  const pastRows = active.filter(
    (reservation) =>
      slotOf(reservation.startMin, windowStartMin, slotMinutes) < nowSlot && !needsAttention(reservation, nowMin),
  );
  const folded = pastRows.length > 0 ? { untilMin: nowSlot, rows: pastRows } : null;

  const slots: RailSlot[] = [];
  for (let startMin = windowStartMin; startMin < windowEndMin; startMin += slotMinutes) {
    const inSlot = active.filter(
      (reservation) => slotOf(reservation.startMin, windowStartMin, slotMinutes) === startMin,
    );
    const rows = startMin < nowSlot ? inSlot.filter((reservation) => needsAttention(reservation, nowMin)) : inSlot;
    if (startMin < nowSlot && rows.length === 0) continue;

    const taken = holding
      .filter((reservation) => reservation.startMin <= startMin && reservation.endMin > startMin)
      .reduce((total, reservation) => total + reservation.partySize, 0);
    const occupancy = totalSeats > 0 ? Math.min(1, taken / totalSeats) : 0;
    const isNow = startMin === nowSlot;
    const open =
      isNow ||
      (startMin > nowSlot && startMin < nowMin + OPEN_AHEAD_MIN) ||
      rows.some((reservation) => needsAttention(reservation, nowMin));

    slots.push({
      startMin,
      isNow,
      open,
      rows,
      arrivals: rows.length,
      guests: rows.reduce((total, reservation) => total + reservation.partySize, 0),
      freeSeats: Math.max(0, totalSeats - taken),
      load: loadOf(occupancy),
      occupancy,
    });
  }

  return { folded, slots };
}
