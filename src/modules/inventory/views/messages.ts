// A type-only import: erased from the browser bundle, and it keeps the server entry, which reads this key, free of
// the client entry's React provider (ADR 0016, W0).
import type { MessageKey, Plural } from "@/core/i18n";

import type { PurchaseOrderStatus } from "../schema";

/** What every table of the inventory views says the same way. */
interface ListMessages {
  readonly search: { readonly label: string; readonly placeholder: string };
  /** A view whose read succeeded with no rows. */
  readonly empty: { readonly title: string; readonly description: string };
  readonly label: string;
  readonly pagesLabel: string;
  /** Placeholders: `{from}`, `{to}`, `{total}`; `{count}` (the total) selects the form. */
  readonly range: Plural;
  readonly noSupplier: string;
}

/** Text of the stock and supplier-order tables. */
export interface InventoryViewsMessages {
  readonly pager: {
    readonly rowsPerPage: string;
    readonly previousPage: string;
    readonly nextPage: string;
    /** Placeholders: `{page}`. */
    readonly page: string;
    readonly clearFilters: string;
    readonly noMatchTitle: string;
    readonly noMatchDescription: string;
  };
  readonly stock: ListMessages & {
    readonly columns: {
      readonly item: string;
      readonly sku: string;
      readonly onHand: string;
      readonly level: string;
      readonly supplier: string;
    };
    /** For a unit code the seeds do not know: the count and the code as stored. Placeholders: `{count}`, `{unit}`. */
    readonly onHand: string;
    /** A piece of stock in words, by unit code (`unit`, `bottle`, `litre`…); `{count}` selects the form. */
    readonly units: Readonly<Record<string, Plural>>;
    readonly level: { readonly below: string; readonly ok: string };
    readonly filters: { readonly levelLabel: string; readonly allLevels: string };
  };
  readonly orders: ListMessages & {
    readonly columns: {
      readonly order: string;
      readonly supplier: string;
      readonly status: string;
      readonly orderedOn: string;
      readonly expectedOn: string;
      readonly total: string;
    };
    readonly notSet: string;
    readonly filters: { readonly statusLabel: string; readonly allStatuses: string };
    readonly statuses: Readonly<Record<PurchaseOrderStatus, string>>;
  };
}

export const inventoryViewsMessageKey: MessageKey<InventoryViewsMessages> = { namespace: "inventoryViews" };
