import { type MessageKey, messageKey, type PageMeta, type Plural } from "@/core/i18n/client";

import type { Category, ProductStatus, SeedProductId } from "./data";

/** Text of /dashboard/products: the catalogue table, the add drawer, the edit dialog and the demo product names. */
export interface ProductsMessages {
  readonly meta: PageMeta;
  readonly title: string;
  readonly subtitle: string;
  readonly addProduct: string;
  readonly search: { readonly label: string; readonly placeholder: string };
  readonly clearFilters: string;
  readonly filters: {
    readonly statusLabel: string;
    readonly categoryLabel: string;
    readonly allStatuses: string;
    readonly allCategories: string;
  };
  readonly statuses: Readonly<Record<ProductStatus, string>>;
  readonly categories: Readonly<Record<Category, string>>;
  /** Demo content: the catalogue's product names, written for each language. */
  readonly names: Readonly<Record<SeedProductId, string>>;
  readonly columns: {
    readonly product: string;
    readonly sku: string;
    readonly category: string;
    readonly status: string;
    readonly inventory: string;
    readonly price: string;
    readonly unitsSold: string;
    readonly actions: string;
  };
  readonly stock: {
    readonly out: string;
    /** Placeholders: `{count}`. */
    readonly inStock: string;
    /** Placeholders: `{count}`. */
    readonly low: string;
  };
  readonly row: {
    /** Placeholders: `{name}`. */
    readonly select: string;
    readonly selectAll: string;
    /** Placeholders: `{name}`. */
    readonly actionsFor: string;
    readonly edit: string;
    readonly duplicate: string;
    /** The name of a duplicated product. Placeholders: `{name}`. */
    readonly copyOf: string;
  };
  readonly table: {
    readonly label: string;
    readonly emptyTitle: string;
    readonly emptyDescription: string;
    /** Placeholders: `{from}`, `{to}`, `{total}`; `{count}` (the total) selects the form. */
    readonly range: Plural;
    /** Placeholders: `{range}`, `{selected}`. */
    readonly rangeSelected: string;
    readonly rowsPerPage: string;
    readonly pagesLabel: string;
    readonly previousPage: string;
    readonly nextPage: string;
    /** Placeholders: `{page}`. */
    readonly page: string;
  };
  readonly toasts: { readonly duplicated: string; readonly saved: string };
  readonly form: {
    readonly addTitle: string;
    readonly editTitle: string;
    readonly addDescription: string;
    readonly editDescription: string;
    readonly closeAdd: string;
    readonly name: string;
    readonly namePlaceholder: string;
    readonly description: string;
    readonly descriptionPlaceholder: string;
    readonly sku: string;
    readonly skuPlaceholder: string;
    readonly category: string;
    readonly status: string;
    /** Placeholders: `{symbol}`, the business currency's symbol. */
    readonly price: string;
    readonly stock: string;
    readonly cancel: string;
    readonly validate: string;
    readonly saveChanges: string;
    readonly valid: string;
    readonly invalid: string;
    readonly skuTaken: string;
  };
  readonly images: {
    readonly label: string;
    readonly add: string;
    /** Placeholders: `{max}` (images), `{size}` (MB). */
    readonly help: string;
    readonly selected: string;
    /** Placeholders: `{name}`. */
    readonly remove: string;
    readonly clear: string;
    readonly empty: string;
    /** Placeholders: `{size}` (MB). */
    readonly tooLarge: string;
    /** Placeholders: `{size}` (KB). */
    readonly fileSize: string;
    /** Placeholders: `{size}` (KB). */
    readonly coverSize: string;
  };
  /** Messages of the add form's schema (`createProductSchema`). Placeholders: `{max}`. */
  readonly validation: {
    readonly nameRequired: string;
    readonly nameMax: string;
    readonly descriptionRequired: string;
    readonly descriptionMax: string;
    readonly imagesMax: string;
    readonly imageType: string;
    readonly imageSize: string;
    readonly skuRequired: string;
    readonly skuMax: string;
    readonly skuPattern: string;
    readonly priceRequired: string;
    readonly pricePattern: string;
    readonly priceMax: string;
    readonly stockRequired: string;
    readonly stockPattern: string;
    readonly stockMax: string;
  };
}

export const productsMessageKey: MessageKey<ProductsMessages> = messageKey<ProductsMessages>("products");
