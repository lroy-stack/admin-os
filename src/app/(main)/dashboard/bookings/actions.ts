"use server";

import { z } from "zod";

import { getRuntime } from "@/config/runtime";
import { getVertical } from "@/config/vertical.server";
import { runWrite } from "@/config/write-action.server";
import { serializeCallResult } from "@/core/client";
import { ErrorCodes } from "@/core/errors";
import { errorText } from "@/core/i18n";
import { err, isAwaitingApproval } from "@/core/result";
import { availabilitySchema } from "@/modules/bookings";
import { bookingsErrors } from "@/modules/bookings/server";

import { GUEST_SEARCH_LIMIT, type GuestSearchAnswer, guestRowSchema } from "./_components/guest-search";
import { BOOKING_SLOTS } from "./_components/guest-slots";
import { loadSlot, slotWriteOf } from "./_components/guest-slots.server";
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

/**
 * Adds the new contact a reservation is for, before the booking, through the write of the module that fills the
 * `bookings.contact-fields` slot (ADR 0017 §4): `{ name, phone?, email? }` for customers. With no filler it is refused.
 */
export async function createGuest(input: unknown, attemptKey: unknown) {
  // The preset only: `getRuntime` must not run before `runWrite` has started the demo session.
  const vertical = await getVertical();
  const write = slotWriteOf(BOOKING_SLOTS.contactFields, vertical.modules);
  if (write === undefined)
    return serializeCallResult(err(ErrorCodes.unavailable, "No module fills bookings.contact-fields"));
  return runWrite(write, input, attemptKey);
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
 * The guests whose name or phone contain `text`, concise rows only, for the guest field of the New reservation panel.
 * A read through the module that fills the `bookings.guest-search` slot (ADR 0017 §4): only the id, name and phone reach
 * the browser, and a failure answers with the filler's translated text.
 */
export async function searchGuests(text: unknown): Promise<GuestSearchAnswer> {
  const { client, locale, vertical } = await getRuntime();
  const context = { locale, call: (capability: string, input: unknown) => client.call(capability, input) };
  const found = await loadSlot(
    BOOKING_SLOTS.guestSearch,
    context,
    { text, limit: GUEST_SEARCH_LIMIT },
    vertical.modules,
  );
  if (found.state.status !== "ready" && found.state.status !== "empty") {
    return {
      status: "error",
      text: found.reason ?? errorText({ code: ErrorCodes.unavailable }, bookingsErrors, locale),
    };
  }
  const rows = z.array(guestRowSchema).safeParse(found.rows);
  return rows.success
    ? { status: "ok", rows: rows.data }
    : { status: "error", text: errorText({ code: ErrorCodes.invalidOutput }, bookingsErrors, locale) };
}
