import type { BusinessClock } from "@/core/clock";

import type { BookingStatus } from "./schema";

/** Minutes in a business day; a booking cannot run past its midnight. */
export const DAY_MINUTES = 1440;

/** The statuses that hold their resources: a booking in any other status frees them. */
export const ACTIVE_STATUSES: readonly BookingStatus[] = ["pending", "awaiting_payment", "confirmed", "in_progress"];

export const isActive = (status: BookingStatus): boolean => ACTIVE_STATUSES.includes(status);

/** The one step `bookings.status.advance` takes from each status; cancel and no-show have their own capabilities. */
export const NEXT_STATUS: Readonly<Partial<Record<BookingStatus, BookingStatus>>> = {
  pending: "confirmed",
  awaiting_payment: "confirmed",
  confirmed: "in_progress",
  in_progress: "completed",
};

/** A party that is already seated or gone cannot be cancelled; it is completed or left as it is. */
export const CANCELLABLE_STATUSES: readonly BookingStatus[] = ["pending", "awaiting_payment", "confirmed"];

export interface Span {
  readonly startMin: number;
  readonly endMin: number;
}

/** Half-open: a stay that ends when the next one starts does not overlap it. */
export const overlaps = (a: Span, b: Span): boolean => a.startMin < b.endMin && b.startMin < a.endMin;

/** A resource without a stated capacity (a chair, a bay) seats one party member. */
export const seatsOf = (resource: { readonly capacity?: number }): number => resource.capacity ?? 1;

/** The end of a stay that starts at `startMin`, held to the end of the business day. */
export const stayEnd = (startMin: number, stayMinutes: number): number => Math.min(startMin + stayMinutes, DAY_MINUTES);

/**
 * The clock's minute counted from the midnight of its business day: after midnight but before the cut-off it is
 * still the previous business day, so the minute continues past 1440.
 */
export const serviceMinute = (clock: BusinessClock): number =>
  clock.nowMin < clock.cutoffMin ? clock.nowMin + DAY_MINUTES : clock.nowMin;

/** The multiples of `gridMinutes` from midnight that start inside the window (end excluded). */
export function slotStarts(window: Span, gridMinutes: number): number[] {
  const starts: number[] = [];
  for (
    let start = Math.ceil(window.startMin / gridMinutes) * gridMinutes;
    start < window.endMin;
    start += gridMinutes
  ) {
    starts.push(start);
  }
  return starts;
}
