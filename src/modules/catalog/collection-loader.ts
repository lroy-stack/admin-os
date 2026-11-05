import type { Locale, LocalizedText } from "@/core/i18n";
import type { ViewLoader } from "@/core/views";
import { readAllRows } from "@/core/views/server";

import { catalogCollectionView } from "./module";
import { type CatalogItem, catalogItemSchema } from "./schema";
import type { ProductRow } from "./views/model";

const nameIn = (name: LocalizedText, locale: Locale) => name.translations[locale] ?? name.source;

/** The `catalog.collection` loader (ADR 0018 §3): the items of the view's categories, in catalog order. */
export const loadCatalogCollection: ViewLoader = async (context, params) => {
  const { categoryIds } = catalogCollectionView.params.parse(params);
  return readAllRows(context, {
    capability: "catalog.list",
    input: { categoryIds },
    item: catalogItemSchema,
    row: (item: CatalogItem): ProductRow => ({
      id: item.id,
      name: nameIn(item.name, context.locale),
      price: item.price,
      status: item.status,
    }),
  });
};
