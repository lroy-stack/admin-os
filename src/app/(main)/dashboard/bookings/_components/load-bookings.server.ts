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
import { type Customer, customerSchema } from "@/modules/customers";
import { customersErrors } from "@/modules/customers/server";
import { resourceSchema } from "@/modules/resources";

import { PAGE_LIMIT, readAllPages } from "./read-pages";
import {
  businessDayFrom,
  customerIdsOf,
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
const customersPage = pageOutput(customerSchema);

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
      reason: errorText({ code }, code.startsWith("customers.") ? customersErrors : bookingsErrors, locale),
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
  if (!guests.ok) return failed(guests, service);

  const reservations = toReservations(bookings.value, {
    today: clock.value.today,
    customers: guests.value,
    resourceLabels: new Map(resources.value.map((resource) => [resource.id, resource.label])),
  });
  return { state: readStateOf(ok(reservations), (list) => list.length === 0), service, reservations };
}

/**
 * The customer records of the guests a day's bookings name, from one list read instead of one read per guest. A
 * booking whose guest is not in the directory fails the day with `customers.not_found`, as a single read would.
 */
async function readGuests(ids: readonly string[]): Promise<Result<Map<string, Customer>>> {
  const guests = new Map<string, Customer>();
  if (ids.length === 0) return ok(guests);
  const { client } = await getRuntime();
  const directory = await readAllPages(async (cursor) =>
    answerOf(await client.call("customers.list", { limit: PAGE_LIMIT, ...withCursor(cursor) }), customersPage),
  );
  if (!directory.ok) return directory;
  const byId = new Map(directory.value.map((customer) => [customer.id, customer]));
  for (const id of ids) {
    const customer = byId.get(id);
    if (customer === undefined) return err("customers.not_found", `Customer ${id} is not in the directory`);
    guests.set(id, customer);
  }
  return ok(guests);
}
