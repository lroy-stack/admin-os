import { type MessageKey, messageKey, type PageMeta, type Plural } from "@/core/i18n/client";

import type { ProductStatus } from "./products-model";

/** Text of /dashboard/products: the views toggle, the search and filter, and the product table. */
export interface ProductsMessages {
  readonly meta: PageMeta;
  readonly title: string;
  readonly subtitle: string;
  /** The accessible name of the toggle between the views the business offers. */
  readonly viewsLabel: string;
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

export const productsMessageKey: MessageKey<ProductsMessages> = messageKey<ProductsMessages>("products");
