import type { DiningTable } from "./floor/floor-model";
import { canSeat } from "./floor/table-state";
import { isActive } from "./reservation-status";
import type { Reservation } from "./view-model";

/** The last minute of a business day; a stay is held to it, as the server holds it. */
const DAY_END_MIN = 1440;

/** Most covers one walk-in window seats; a bigger party is a booking on joined tables. */
export const MAX_WALK_IN_COVERS = 20;

type Located = { readonly table: Pick<DiningTable, "id" | "label" | "capacity" | "inService"> };

/** What the Walk-in window can offer a party of `covers`, from the day as loaded. */
export type WalkInOptions<L extends Located> =
  /** Tables that are in service, seat the party and are free from now for the stay, the closest fit first. */
  | { readonly kind: "fits"; readonly tables: L[] }
  /** Tables seat the party but are all taken; `next` is the first to free up for a whole stay, null if none tonight. */
  | { readonly kind: "taken"; readonly next: { readonly location: L; readonly atMin: number } | null }
  /** No table in service seats the party. `largest` is the biggest one's seats, 0 when none is in service. */
  | { readonly kind: "too_big"; readonly largest: number };

/** The smallest table that seats the party first, so a big table is not spent on two; then by label as people count. */
export const byFit = (a: Located, b: Located) =>
  a.table.capacity - b.table.capacity || a.table.label.localeCompare(b.table.label, undefined, { numeric: true });

/**
 * The earliest minute, from `nowMin` on, at which `tableId` is free for a whole stay of `stayMin`. A seated party holds
 * its table at least until now, even when it overstays.
 */
function freeFrom(tableId: string, reservations: readonly Reservation[], nowMin: number, stayMin: number): number {
  const holds = reservations
    .filter((reservation) => isActive(reservation) && reservation.tableIds.includes(tableId))
    .map((reservation) => ({
      start: reservation.startMin,
      end: reservation.status === "seated" ? Math.max(reservation.endMin, nowMin) : reservation.endMin,
    }))
    .sort((a, b) => a.start - b.start);

  let from = nowMin;
  for (const hold of holds) {
    if (hold.start < from + stayMin && from < hold.end) from = hold.end;
  }
  return from;
}

/**
 * The tables to suggest for a walk-in of `covers` arriving at `nowMin` and expected to stay `stayMin` (plan 003, B4):
 * in service, big enough, and with no active booking overlapping the stay. The server decides again when the party is
 * seated, so a stale suggestion fails with its own message instead of double-booking.
 */
export function walkInOptions<L extends Located>({
  locations,
  reservations,
  covers,
  nowMin,
  stayMin,
}: {
  locations: readonly L[];
  reservations: readonly Reservation[];
  covers: number;
  nowMin: number;
  stayMin: number;
}): WalkInOptions<L> {
  const party = { id: "walk-in", partySize: covers, startMin: nowMin, endMin: Math.min(nowMin + stayMin, DAY_END_MIN) };
  const fits = locations.filter(({ table }) => canSeat(table, party, reservations, nowMin));
  if (fits.length > 0) return { kind: "fits", tables: [...fits].sort(byFit) };

  const roomy = locations.filter(({ table }) => table.inService && table.capacity >= covers);
  if (roomy.length === 0) {
    const largest = Math.max(0, ...locations.filter(({ table }) => table.inService).map(({ table }) => table.capacity));
    return { kind: "too_big", largest };
  }

  const frees = roomy
    .map((location) => ({ location, atMin: freeFrom(location.table.id, reservations, nowMin, stayMin) }))
    .filter(({ atMin }) => atMin < DAY_END_MIN)
    .sort((a, b) => a.atMin - b.atMin || byFit(a.location, b.location));
  return { kind: "taken", next: frees[0] ?? null };
}

/** The table to select when the host has not chosen one, or has chosen one that no longer fits. */
export function selectedTableId<L extends Located>(options: WalkInOptions<L>, chosen: string | null): string | null {
  if (options.kind !== "fits") return null;
  return options.tables.find(({ table }) => table.id === chosen)?.table.id ?? options.tables[0]?.table.id ?? null;
}
