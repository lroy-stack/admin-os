import "server-only";

import { z } from "zod";

import { getRuntime } from "@/config/runtime";
import { businessClockSchema } from "@/core/clock";
import { ErrorCodes } from "@/core/errors";
import { errorText } from "@/core/i18n";
import { pageOutput } from "@/core/pagination";
import { type CallResult, err, isAwaitingApproval, ok, type ReadStatus, type Result, readStateOf } from "@/core/result";
import { bookingSchema, lateAfterMinutes, serviceWindow, walkInStayMinutes } from "@/modules/bookings";
import { bookingsErrors } from "@/modules/bookings/server";
import { resourceSchema } from "@/modules/resources";

import { BOOKING_SLOTS } from "./guest-slots";
import { loadSlot } from "./guest-slots.server";
import { PAGE_LIMIT, readAllPages } from "./read-pages";
import {
  businessDayFrom,
  customerIdsOf,
  type GuestRecord,
  guestRecordSchema,
  nowMinFor,
  type Reservation,
  type ServiceDay,
  toReservations,
} from "./view-model";

export interface LoadedBookings {
  readonly state: ReadStatus;
  /** The translated reason when a read failed or was refused. */
  readonly reason?: string;
  /** Null when the clock or the settings could not be read: there is no day to show. */
  readonly service: ServiceDay | null;
  readonly reservations: Reservation[];
}

const SETTING_KEYS = [lateAfterMinutes.key, walkInStayMinutes.key, serviceWindow.key];

const settingsSchema = z.object({ values: z.record(z.string(), z.unknown()) });
const bookingsPage = pageOutput(bookingSchema);
const resourcesPage = pageOutput(resourceSchema);

const withCursor = (cursor: string | undefined) => (cursor === undefined ? {} : { cursor });

/** The answer of a read as a typed result: a held or malformed answer is an invalid output, never a value. */
function answerOf<T>(answer: CallResult<unknown>, schema: z.ZodType<T>): Result<T> {
  if (isAwaitingApproval(answer)) return err(ErrorCodes.invalidOutput, "A read was held for approval");
  if (!answer.ok) return answer;
  const parsed = schema.safeParse(answer.value);
  return parsed.success ? ok(parsed.data) : err(ErrorCodes.invalidOutput, "The answer does not match its schema");
}

/**
 * Reads the business day in the URL (the clock's day by default) through the data seam (ADR 0005): its bookings, the
 * places and the guests they name, the clock and the settings that decide what is late. A failed read shows as an
 * error or a refusal, never as an empty day.
 */
export async function loadBookings(dayParam: string | undefined): Promise<LoadedBookings> {
  const { client, locale } = await getRuntime();
  const failed = (answer: Result<never>, service: ServiceDay | null): LoadedBookings => {
    const code = answer.ok ? "" : answer.error.code;
    return {
      state: readStateOf(answer, () => false),
      reason: errorText({ code }, bookingsErrors, locale),
      service,
      reservations: [],
    };
  };

  const [clock, settings] = await Promise.all([
    client.call("clock.get", {}).then((answer) => answerOf(answer, businessClockSchema)),
    client.call("settings.values.get", { keys: SETTING_KEYS }).then((answer) => answerOf(answer, settingsSchema)),
  ]);
  if (!clock.ok) return failed(clock, null);
  if (!settings.ok) return failed(settings, null);

  const businessDay = businessDayFrom(dayParam, clock.value.businessDay);
  const { values } = settings.value;
  const service: ServiceDay = {
    businessDay,
    isToday: businessDay === clock.value.businessDay,
    nowMin: nowMinFor(businessDay, clock.value),
    window: serviceWindow.schema.parse(values[serviceWindow.key]),
    lateAfterMin: lateAfterMinutes.schema.parse(values[lateAfterMinutes.key]),
    walkInStayMin: walkInStayMinutes.schema.parse(values[walkInStayMinutes.key]),
  };

  const [bookings, resources] = await Promise.all([
    readAllPages(async (cursor) =>
      answerOf(
        await client.call("bookings.list", { businessDay, limit: PAGE_LIMIT, ...withCursor(cursor) }),
        bookingsPage,
      ),
    ),
    readAllPages(async (cursor) =>
      answerOf(await client.call("resources.list", { limit: PAGE_LIMIT, ...withCursor(cursor) }), resourcesPage),
    ),
  ]);
  if (!bookings.ok) return failed(bookings, service);
  if (!resources.ok) return failed(resources, service);

  const guests = await readGuests(customerIdsOf(bookings.value));
  if (!guests.ok) return { state: guests.state, reason: guests.reason, service, reservations: [] };

  const reservations = toReservations(bookings.value, {
    today: clock.value.today,
    customers: guests.guests,
    resourceLabels: new Map(resources.value.map((resource) => [resource.id, resource.label])),
  });
  return { state: readStateOf(ok(reservations), (list) => list.length === 0), service, reservations };
}

/**
 * The records of the guests a day's bookings name, from the module that fills the `bookings.guests` slot (ADR 0017
 * §4), as one read instead of one per guest. Its failure (a guest that is not in the directory, a refusal) fails the
 * day with the filler's own translated reason; with no filler there are no records and a booking names its contact.
 */
async function readGuests(ids: readonly string[]): Promise<Guests> {
  const { client, locale, vertical } = await getRuntime();
  const context = { locale, call: (capability: string, input: unknown) => client.call(capability, input) };
  const loaded = await loadSlot(BOOKING_SLOTS.guests, context, { ids }, vertical.modules);
  if (loaded.state.status !== "ready" && loaded.state.status !== "empty") {
    return { ok: false, state: loaded.state, ...(loaded.reason === undefined ? {} : { reason: loaded.reason }) };
  }
  const rows = z.array(guestRecordSchema).safeParse(loaded.rows);
  if (!rows.success) {
    return {
      ok: false,
      state: { status: "error", code: ErrorCodes.invalidOutput },
      reason: errorText({ code: ErrorCodes.invalidOutput }, bookingsErrors, locale),
    };
  }
  return { ok: true, guests: new Map(rows.data.map((guest) => [guest.id, guest])) };
}

type Guests =
  | { readonly ok: true; readonly guests: Map<string, GuestRecord> }
  | { readonly ok: false; readonly state: ReadStatus; readonly reason?: string };
