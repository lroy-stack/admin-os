import type { z } from "zod";

import { defineMessages, type ErrorMessages, errorText } from "@/core/i18n";
import { pageOutput } from "@/core/pagination";
import { isAwaitingApproval, readStateOf } from "@/core/result";

import type { ViewData, ViewLoaderContext } from "./index";

/** A catalog-style read has no error codes of its own: the class texts (forbidden, unavailable…) are enough. */
const classTextsOnly = defineMessages<ErrorMessages>({ en: {}, es: {}, de: {}, fr: {} });

/** The most items one page of a list capability may hold. */
const PAGE_LIMIT = 200;

/**
 * Reads a list capability to its last page and maps each item to a row. A failure is never an empty list: the state
 * says forbidden or error, with the reason in the request's language (ADR 0005).
 */
export async function readAllRows<Item, Row>(
  { call, locale }: ViewLoaderContext,
  read: {
    readonly capability: string;
    readonly input: Readonly<Record<string, unknown>>;
    readonly item: z.ZodType<Item>;
    readonly row: (item: Item) => Row;
  },
): Promise<ViewData<Row>> {
  const page = pageOutput(read.item);
  const rows: Row[] = [];
  let cursor: string | undefined;
  do {
    const answer = await call(read.capability, {
      ...read.input,
      limit: PAGE_LIMIT,
      ...(cursor === undefined ? {} : { cursor }),
    });
    if (isAwaitingApproval(answer) || !answer.ok) {
      const reason = isAwaitingApproval(answer) ? undefined : errorText(answer.error, classTextsOnly, locale);
      return { state: readStateOf(answer, () => false), ...(reason === undefined ? {} : { reason }), rows: [] };
    }
    const parsed = page.parse(answer.value);
    rows.push(...parsed.items.map(read.row));
    cursor = parsed.nextCursor ?? undefined;
  } while (cursor !== undefined);
  return { state: { status: rows.length === 0 ? "empty" : "ready" }, rows };
}
