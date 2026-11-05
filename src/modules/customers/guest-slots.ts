import { z } from "zod";

import { ErrorCodes } from "@/core/errors";
import { errorText } from "@/core/i18n";
import { pageOutput } from "@/core/pagination";
import { err, isAwaitingApproval, readStateOf } from "@/core/result";
import type { ViewData, ViewLoader } from "@/core/views";
import { readAllRows } from "@/core/views/server";

import { customersErrors } from "./messages";
import { customerSchema, customerSummarySchema } from "./schema";

/**
 * The server halves of the slots customers fills in the bookings route (ADR 0017 §4): `bookings.guests` reads the
 * customer records a day's bookings name, and `bookings.guest-search` finds a customer by name or phone. The slot ids
 * are the route's; this module names them only here and in its manifest.
 */

const guestsParams = z.object({ ids: z.array(z.string()) });
const searchParams = z.object({ text: z.unknown(), limit: z.number() });
const searchPage = pageOutput(customerSummarySchema);

/** What the bookings route reads of a guest's record: the customer's identity, contact and the figures of the profile. */
const guestRow = (customer: z.infer<typeof customerSchema>) => ({
  id: customer.id,
  name: customer.name,
  email: customer.email,
  phone: customer.phone,
  locale: customer.locale,
  figures: customer.figures,
  ext: customer.ext,
});

/**
 * `bookings.guests` (`{ ids }`): the records of those customers, from one list read instead of one read per guest. An
 * id that is not in the directory fails the read with `customers.not_found`, as a single read would.
 */
export const loadGuests: ViewLoader = async (context, params) => {
  const { ids } = guestsParams.parse(params);
  if (ids.length === 0) return { state: { status: "empty" }, rows: [] };
  const directory = await readAllRows(context, {
    capability: "customers.list",
    input: {},
    item: customerSchema,
    row: guestRow,
  });
  if (directory.state.status !== "ready" && directory.state.status !== "empty") return directory;
  const byId = new Map(directory.rows.map((row) => [row.id, row]));
  const missing = ids.find((id) => !byId.has(id));
  if (missing !== undefined) {
    const code = "customers.not_found";
    return {
      state: readStateOf(err(code, `Customer ${missing} is not in the directory`), () => false),
      reason: errorText({ code }, customersErrors, context.locale),
      rows: [],
    };
  }
  const rows = ids.flatMap((id) => byId.get(id) ?? []);
  return { state: { status: rows.length === 0 ? "empty" : "ready" }, rows };
};

/** `bookings.guest-search` (`{ text, limit }`): the customers whose name or phone contain `text`, as id, name and phone. */
export const searchGuests: ViewLoader = async ({ call, locale }, params) => {
  const { text, limit } = searchParams.parse(params);
  const failed = (code: string): ViewData => ({
    state: readStateOf(err(code, "The search failed"), () => false),
    reason: errorText({ code }, customersErrors, locale),
    rows: [],
  });
  const answer = await call("customers.search", { text, limit });
  if (isAwaitingApproval(answer)) return failed(ErrorCodes.unavailable);
  if (!answer.ok) return failed(answer.error.code);
  const found = searchPage.safeParse(answer.value);
  if (!found.success) return failed(ErrorCodes.invalidOutput);
  const rows = found.data.items.map(({ id, name, phone }) => ({ id, name, phone: phone ?? null }));
  return { state: { status: rows.length === 0 ? "empty" : "ready" }, rows };
};
