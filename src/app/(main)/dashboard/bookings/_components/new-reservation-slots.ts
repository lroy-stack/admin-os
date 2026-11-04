import type { Availability } from "@/modules/bookings";

import type { ServiceDay } from "./view-model";
import { byFit } from "./walk-in-options";

/** One start time a party can be booked at, with the tables that are free for the stay and seat it on their own. */
export interface SlotOption {
  readonly startMin: number;
  readonly endMin: number;
  readonly tableIds: readonly string[];
}

/** What the New reservation panel learns when it asks `bookings.availability.get` for a day and a party. */
export type AvailabilityAnswer =
  | { readonly status: "ok"; readonly slots: Availability["slots"] }
  | { readonly status: "error"; readonly text: string };

/**
 * The slots to offer for `date`: the ones with a table free and, on the clock's own day, only the ones still ahead (a
 * booking cannot start in the past). An empty list means no slot fits the party that day.
 */
export function slotOptions(slots: Availability["slots"], date: string, service: ServiceDay): SlotOption[] {
  const pastBefore = service.isToday && date === service.businessDay ? service.nowMin : 0;
  return slots
    .filter((slot) => slot.resourceIds.length > 0 && slot.startMin >= pastBefore)
    .map(({ startMin, endMin, resourceIds }) => ({ startMin, endMin, tableIds: resourceIds }))
    .sort((a, b) => a.startMin - b.startMin);
}

type Seating = {
  readonly table: {
    readonly id: string;
    readonly label: string;
    readonly capacity: number;
    readonly inService: boolean;
  };
};

/** The tables of the plan that fit the chosen slot, the closest fit first; a table the plan does not draw is left out. */
export function fittingTables<L extends Seating>(slot: SlotOption | null, locations: readonly L[]): L[] {
  if (slot === null) return [];
  return locations.filter(({ table }) => slot.tableIds.includes(table.id)).sort(byFit);
}
