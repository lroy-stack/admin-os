import type { ReadStatus } from "@/core/result";

/** The statuses a catalog item has (`catalogItemSchema`), in the order the filter lists them. */
export const PRODUCT_STATUSES = ["active", "inactive", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

/** What the table shows of one catalog item: the server has already chosen the name in the request's language. */
export interface ProductRow {
  readonly id: string;
  readonly name: string;
  readonly price: { readonly amountMinor: number; readonly currency: string };
  readonly status: ProductStatus;
}

/** One view of the toggle with the answer of its read. */
export interface ProductViewData {
  readonly id: string;
  /** The label in the preset's words. */
  readonly label: string;
  readonly state: ReadStatus;
  /** The translated reason when the read failed or was refused. */
  readonly reason?: string;
  readonly rows: readonly ProductRow[];
}
