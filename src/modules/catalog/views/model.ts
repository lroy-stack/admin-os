/** The statuses a catalog item has (`catalogItemSchema`), in the order the filter lists them. */
export const PRODUCT_STATUSES = ["active", "inactive", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

/** What the table shows of one catalog item: the loader has already chosen the name in the request's language. */
export interface ProductRow {
  readonly id: string;
  readonly name: string;
  readonly price: { readonly amountMinor: number; readonly currency: string };
  readonly status: ProductStatus;
}
