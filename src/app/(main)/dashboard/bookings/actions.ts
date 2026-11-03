"use server";

import { runWrite } from "@/config/write-action.server";

/** Moves a booking one step forward: `{ id, to }` (`bookings.status.advance`). */
export async function advanceStatus(input: unknown, attemptKey: unknown) {
  return runWrite("bookings.status.advance", input, attemptKey);
}

/** Takes back the last forward step within the undo window: `{ id }` (`bookings.status.undo`). */
export async function undoStatus(input: unknown, attemptKey: unknown) {
  return runWrite("bookings.status.undo", input, attemptKey);
}

/** Cancels a booking with the reason staff will see: `{ id, reason }` (`bookings.cancel`, destructive). */
export async function cancelBooking(input: unknown, attemptKey: unknown) {
  return runWrite("bookings.cancel", input, attemptKey);
}

/** Seats a party that arrived without a booking, now: `{ partySize, resourceIds, contactName? }`. */
export async function seatWalkIn(input: unknown, attemptKey: unknown) {
  return runWrite("bookings.walk_in.seat", input, attemptKey);
}

/** Takes back a walk-in that was just seated: `{ id }` (`bookings.walk_in.undo`). */
export async function undoWalkIn(input: unknown, attemptKey: unknown) {
  return runWrite("bookings.walk_in.undo", input, attemptKey);
}

/** Marks a late confirmed booking as a no-show: `{ id, reason? }` (`bookings.no_show.mark`, destructive). */
export async function markNoShow(input: unknown, attemptKey: unknown) {
  return runWrite("bookings.no_show.mark", input, attemptKey);
}
