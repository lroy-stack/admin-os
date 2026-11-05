// A type-only import: erased from the browser bundle, and it keeps the server entry, which reads this key, free of
// the client entry's React provider (ADR 0016, W0).
import type { MessageKey, Plural } from "@/core/i18n";

import type { ProductStatus } from "./model";

/** Text of the catalog collection table: the search and filter, the columns and the pages. */
export interface CatalogCollectionMessages {
  readonly search: { readonly label: string; readonly placeholder: string };
  readonly clearFilters: string;
  readonly filters: { readonly statusLabel: string; readonly allStatuses: string };
  readonly statuses: Readonly<Record<ProductStatus, string>>;
  readonly columns: { readonly product: string; readonly price: string; readonly status: string };
  /** A view whose read succeeded with no items. */
  readonly empty: { readonly title: string; readonly description: string };
  readonly table: {
    readonly label: string;
    readonly emptyTitle: string;
    readonly emptyDescription: string;
    /** Placeholders: `{from}`, `{to}`, `{total}`; `{count}` (the total) selects the form. */
    readonly range: Plural;
    readonly rowsPerPage: string;
    readonly pagesLabel: string;
    readonly previousPage: string;
    readonly nextPage: string;
    /** Placeholders: `{page}`. */
    readonly page: string;
  };
}

export const catalogCollectionMessageKey: MessageKey<CatalogCollectionMessages> = { namespace: "catalogCollection" };
