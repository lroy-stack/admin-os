import "server-only";

import { getRuntime } from "@/config/runtime";
import { businessClockSchema } from "@/core/clock";
import type { Currency } from "@/core/money/client";
import { pageOutput } from "@/core/pagination";
import { type CallResult, isAwaitingApproval } from "@/core/result";
import { catalogItemSchema } from "@/modules/catalog";

import { loadBusinessDetails } from "../../_components/load-business.server";
import { billingClients, type InvoiceSeed, startingLines } from "./data";

/** How many catalog items a new invoice starts with. */
const STARTING_LINES = 3;
const LIST_LIMIT = 50;

const catalogPage = pageOutput(catalogItemSchema);

const answeredValue = (answer: CallResult<unknown>) =>
  !isAwaitingApproval(answer) && answer.ok ? answer.value : undefined;

/**
 * What a new invoice starts from (spec 008): the business day, the business settings in effect for the session, the
 * billing clients (spec 011: parties with a tax ID, never the agenda's customers) and its first active catalog items
 * as the lines, named in the request's language.
 * The clock and the business settings are required, as the document cannot be dated or issued without them; a list
 * that cannot be read leaves the form without suggestions, never without the form.
 */
export async function loadInvoiceSeed(preferred: Currency): Promise<InvoiceSeed> {
  const { client, actor, locale } = await getRuntime();
  const [clock, business, catalog] = await Promise.all([
    client.call("clock.get", {}),
    loadBusinessDetails(),
    client.call("catalog.list", { limit: LIST_LIMIT }),
  ]);
  const day = answeredValue(clock);
  // The day is the business's (clock capability, ADR 0005), not the server's, which runs in UTC.
  if (day === undefined) throw new Error("The business clock is unavailable.");
  if (business.details === undefined) throw new Error("The business settings are unavailable.");
  const catalogRows = answeredValue(catalog);
  const active =
    catalogRows === undefined
      ? []
      : catalogPage
          .parse(catalogRows)
          .items.filter((item) => item.status === "active")
          .slice(0, STARTING_LINES);
  const lines = startingLines(active, preferred, locale);

  return {
    today: businessClockSchema.parse(day).today,
    currency: lines.currency,
    business: business.details,
    clients: billingClients,
    items: lines.items,
    issuerName: actor.displayName ?? actor.roleId,
  };
}
