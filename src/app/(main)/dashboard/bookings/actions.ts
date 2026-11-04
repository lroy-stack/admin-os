"use server";

import { getRuntime } from "@/config/runtime";
import { runWrite } from "@/config/write-action.server";
import { ErrorCodes } from "@/core/errors";
import { errorText } from "@/core/i18n";
import { pageOutput } from "@/core/pagination";
import { isAwaitingApproval } from "@/core/result";
import { availabilitySchema } from "@/modules/bookings";
import { bookingsErrors } from "@/modules/bookings/server";
import { customerSummarySchema } from "@/modules/customers";
import { customersErrors } from "@/modules/customers/server";

import { GUEST_SEARCH_LIMIT, type GuestSearchAnswer } from "./_components/guest-search";
import type { AvailabilityAnswer } from "./_components/new-reservation-slots";

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

/** Creates a confirmed booking: `{ businessDay, startMin, partySize, customerId, channel, resourceIds?, ... }`. */
export async function createReservation(input: unknown, attemptKey: unknown) {
  return runWrite("bookings.create", input, attemptKey);
}

/** Adds the new contact a reservation is for, before the booking: `{ name, phone?, email? }` (`customers.create`). */
export async function createGuest(input: unknown, attemptKey: unknown) {
  return runWrite("customers.create", input, attemptKey);
}

/**
 * The start times of a business day with the tables free for a party, for the New reservation panel. A read, so it
 * neither starts the demo session nor refreshes the page; the capability validates `input` and gates it on
 * `read:bookings`. A failure answers with its translated text so the panel can show it and offer a retry.
 */
export async function findAvailability(input: unknown): Promise<AvailabilityAnswer> {
  const { client, locale } = await getRuntime();
  const answer = await client.call("bookings.availability.get", input as never);
  const failed = (code: string): AvailabilityAnswer => ({
    status: "error",
    text: errorText({ code }, bookingsErrors, locale),
  });
  if (isAwaitingApproval(answer)) return failed(ErrorCodes.unavailable);
  if (!answer.ok) return failed(answer.error.code);
  const found = availabilitySchema.safeParse(answer.value);
  return found.success ? { status: "ok", slots: found.data.slots } : failed(ErrorCodes.invalidOutput);
}

/**
 * The customers whose name or phone contain `text`, concise rows only, for the guest field of the New reservation
 * panel. A read (`customers.search`, `read:customers`); only the id, name and phone reach the browser.
 */
export async function searchGuests(text: unknown): Promise<GuestSearchAnswer> {
  const { client, locale } = await getRuntime();
  const answer = await client.call("customers.search", { text, limit: GUEST_SEARCH_LIMIT } as never);
  const failed = (code: string): GuestSearchAnswer => ({
    status: "error",
    text: errorText({ code }, customersErrors, locale),
  });
  if (isAwaitingApproval(answer)) return failed(ErrorCodes.unavailable);
  if (!answer.ok) return failed(answer.error.code);
  const found = pageOutput(customerSummarySchema).safeParse(answer.value);
  return found.success
    ? { status: "ok", rows: found.data.items.map(({ id, name, phone }) => ({ id, name, phone: phone ?? null })) }
    : failed(ErrorCodes.invalidOutput);
}
