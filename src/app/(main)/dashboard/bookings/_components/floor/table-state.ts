import { isActive, isLate, minutesLate } from "../reservation-status";
import { LATE_AFTER_MIN, type Reservation, SERVICE_NOW_MIN } from "../reservations-data";
import type { DiningTable } from "./floor-model";

/** Thresholds in minutes, the usual service-floor defaults. */
export const TABLE_STATE_THRESHOLDS = { arrivingMin: 30, leavingMin: 15, lateMin: LATE_AFTER_MIN } as const;

export type VisibleTableState = "free" | "arriving" | "seated" | "leaving" | "late" | "blocked";

export type TableReading = {
  state: VisibleTableState;
  /** The reservation that governs the table right now, if any. */
  reservation: Reservation | null;
  /** Next party due on a table that is otherwise free, used for "free for 1 h 50". */
  nextArrival: Reservation | null;
};

/**
 * One state per table at `nowMin`. Precedence: blocked > seated (leaving when it ends soon) > late > arriving > free.
 * Cancelled, no-show and completed bookings never colour a table.
 */
export function readTable(
  table: Pick<DiningTable, "id" | "inService">,
  reservations: readonly Reservation[],
  nowMin = SERVICE_NOW_MIN,
): TableReading {
  const onTable = reservations.filter(
    (reservation) => isActive(reservation) && reservation.tableIds.includes(table.id),
  );
  const upcoming = onTable
    .filter((reservation) => reservation.status !== "seated" && reservation.startMin >= nowMin)
    .sort((a, b) => a.startMin - b.startMin);
  const nextArrival = upcoming[0] ?? null;

  if (!table.inService) return { state: "blocked", reservation: null, nextArrival };

  const seated = onTable.find((reservation) => reservation.status === "seated");
  if (seated) {
    const leaving = seated.endMin - nowMin <= TABLE_STATE_THRESHOLDS.leavingMin;
    return { state: leaving ? "leaving" : "seated", reservation: seated, nextArrival };
  }

  const late = onTable.find((reservation) => isLate(reservation, nowMin));
  if (late) return { state: "late", reservation: late, nextArrival };

  if (nextArrival && nextArrival.startMin - nowMin <= TABLE_STATE_THRESHOLDS.arrivingMin) {
    return { state: "arriving", reservation: nextArrival, nextArrival };
  }

  return { state: "free", reservation: null, nextArrival };
}

/**
 * Whether `party` can sit at `table` for its whole booking: in service, big enough, and no other active booking on
 * the table overlaps [start, end). A seated party holds its table at least until `nowMin`, even when it overstays.
 */
export function canSeat(
  table: Pick<DiningTable, "id" | "inService" | "capacity">,
  party: Reservation,
  reservations: readonly Reservation[],
  nowMin = SERVICE_NOW_MIN,
) {
  if (!table.inService || table.capacity < party.partySize) return false;
  return !reservations.some((other) => {
    if (other.id === party.id || !isActive(other) || !other.tableIds.includes(table.id)) return false;
    const otherEndMin = other.status === "seated" ? Math.max(other.endMin, nowMin) : other.endMin;
    return other.startMin < party.endMin && party.startMin < otherEndMin;
  });
}

/** "45 min", "1 h 50", "2 h" */
export function formatDuration(minutes: number) {
  const safe = Math.max(0, Math.round(minutes));
  if (safe < 60) return `${safe} min`;
  const hours = Math.floor(safe / 60);
  const rest = safe % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest}`;
}

const clock = (minutes: number) =>
  `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** The short status line printed on a table's plate. */
export function describeReading(reading: TableReading, nowMin = SERVICE_NOW_MIN) {
  switch (reading.state) {
    case "blocked":
      return "Blocked";
    case "seated":
    case "leaving": {
      if (!reading.reservation) return "Seated";
      const remaining = reading.reservation.endMin - nowMin;
      return remaining < 0 ? `Over by ${formatDuration(-remaining)}` : `Leaves in ${formatDuration(remaining)}`;
    }
    case "late":
      return reading.reservation ? `Late ${minutesLate(reading.reservation, nowMin)} min` : "Late";
    case "arriving":
      return reading.reservation ? `Arrives ${clock(reading.reservation.startMin)}` : "Arriving";
    case "free":
      return reading.nextArrival ? `Free for ${formatDuration(reading.nextArrival.startMin - nowMin)}` : "Free tonight";
    default: {
      const unreachable: never = reading.state;
      return unreachable;
    }
  }
}

export const tableStateLabels: Record<VisibleTableState, string> = {
  free: "Free",
  arriving: "Arriving",
  seated: "Seated",
  leaving: "Leaving soon",
  late: "Late",
  blocked: "Blocked",
};
