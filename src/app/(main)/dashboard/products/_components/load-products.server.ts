import "server-only";

import { getRuntime } from "@/config/runtime";
import { textFor } from "@/config/vocabulary.server";
import { ErrorCodes } from "@/core/errors";
import { defineMessages, type ErrorMessages, errorText, type Locale, type LocalizedText } from "@/core/i18n";
import { pageOutput } from "@/core/pagination";
import { isAwaitingApproval, type ReadStatus, readStateOf } from "@/core/result";
import { type CatalogItem, catalogCollectionView, catalogItemSchema } from "@/modules/catalog";

import { readableViews } from "./product-views.server";
import type { ProductRow, ProductViewData } from "./products-model";

const pageSchema = pageOutput(catalogItemSchema);

/** The catalog has no error codes of its own: the class texts (forbidden, unavailable…) are enough. */
const catalogErrors = defineMessages<ErrorMessages>({ en: {}, es: {}, de: {}, fr: {} });

/** The most items one page of `catalog.list` may hold. */
const PAGE_LIMIT = 200;

export interface LoadedProducts {
  /** The views the viewer may read, in the preset's order, each with the answer of its read. */
  readonly views: ProductViewData[];
  /** Set when no view is readable. */
  readonly refusal?: { readonly state: ReadStatus; readonly reason: string };
}

const nameIn = (name: LocalizedText, locale: Locale) => name.translations[locale] ?? name.source;

const toRow = (item: CatalogItem, locale: Locale): ProductRow => ({
  id: item.id,
  name: nameIn(item.name, locale),
  price: item.price,
  status: item.status,
});

/**
 * Reads `catalog.list` for the views the viewer may see (ADR 0018 §3, §4), all at once, and maps each answer to what
 * the table shows. Every `catalog.collection` view is the catalog filtered to its categories; the cursor is followed
 * to the end, so the table pages over every item of the view.
 */
export async function loadProducts(): Promise<LoadedProducts> {
  const { client, actor, vertical, locale } = await getRuntime();
  const entries = readableViews(vertical.productViews, vertical.modules, actor.permissions);

  if (entries.length === 0) {
    const code = ErrorCodes.forbidden;
    return {
      views: [],
      refusal: { state: { status: "forbidden", code }, reason: errorText({ code }, catalogErrors, locale) },
    };
  }

  const views = await Promise.all(
    entries.map(async (entry): Promise<ProductViewData> => {
      const label = textFor(vertical.id, locale, entry.labelKey);
      const { categoryIds } = catalogCollectionView.params.parse(entry.params);
      const rows: ProductRow[] = [];
      let cursor: string | undefined;
      do {
        const answer = await client.call("catalog.list", {
          categoryIds,
          limit: PAGE_LIMIT,
          ...(cursor === undefined ? {} : { cursor }),
        });
        if (isAwaitingApproval(answer) || !answer.ok) {
          const state = readStateOf(answer, () => false);
          const reason = isAwaitingApproval(answer) ? undefined : errorText(answer.error, catalogErrors, locale);
          return { id: entry.id, label, state, ...(reason === undefined ? {} : { reason }), rows: [] };
        }
        const page = pageSchema.parse(answer.value);
        rows.push(...page.items.map((item) => toRow(item, locale)));
        cursor = page.nextCursor ?? undefined;
      } while (cursor !== undefined);
      return { id: entry.id, label, state: { status: rows.length === 0 ? "empty" : "ready" }, rows };
    }),
  );
  return { views };
}
