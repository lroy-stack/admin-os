import "server-only";

import { getRuntime } from "@/config/runtime";
import { errorText } from "@/core/i18n";
import { pageOutput } from "@/core/pagination";
import { isAwaitingApproval, type ReadStatus, readStateOf } from "@/core/result";
import { customerSchema } from "@/modules/customers";
import { customersErrors } from "@/modules/customers/server";

import { type CustomerRow, toRow } from "./directory-model";

/** One page of the directory; small enough to render at once, and the cursor leads to the rest. */
export const PAGE_SIZE = 24;

const pageSchema = pageOutput(customerSchema);

export interface LoadedCustomers {
  readonly state: ReadStatus;
  /** The translated reason when the read failed or was refused. */
  readonly reason?: string;
  readonly rows: CustomerRow[];
  readonly nextCursor: string | null;
}

/** Reads one page of `customers.list` for the current actor (ADR 0005) and maps it to what the screen shows. */
export async function loadCustomers(cursor: string | undefined): Promise<LoadedCustomers> {
  const { client, locale } = await getRuntime();
  const answer = await client.call(
    "customers.list",
    cursor === undefined ? { limit: PAGE_SIZE } : { limit: PAGE_SIZE, cursor },
  );
  const state = readStateOf(answer, (value) => pageSchema.parse(value).items.length === 0);

  if (!isAwaitingApproval(answer) && answer.ok) {
    const page = pageSchema.parse(answer.value);
    return { state, rows: page.items.map(toRow), nextCursor: page.nextCursor };
  }
  const reason =
    !isAwaitingApproval(answer) && !answer.ok ? errorText(answer.error, customersErrors, locale) : undefined;
  return { state, ...(reason === undefined ? {} : { reason }), rows: [], nextCursor: null };
}
