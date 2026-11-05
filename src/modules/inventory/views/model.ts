import type { PurchaseOrderStatus } from "../schema";

/** What the stock table shows of one stock item; the loader has chosen the name in the request's language. */
export interface StockRow {
  readonly id: string;
  readonly name: string;
  readonly sku: string;
  readonly onHand: number;
  readonly unit: string;
  /** At or under its reorder point (the rule of `belowReorder` in `inventory.stock.list`). */
  readonly belowReorder: boolean;
  /** Absent when the item has no supplier or it cannot be resolved. */
  readonly supplierName?: string;
}

/** What the orders table shows of one purchase order. */
export interface OrderRow {
  readonly id: string;
  readonly status: PurchaseOrderStatus;
  /** Business days, `YYYY-MM-DD`. */
  readonly orderedOn: string;
  readonly expectedOn?: string;
  /** Σ qty × unitCost, in the currency of the order's lines. */
  readonly total: { readonly amountMinor: number; readonly currency: string };
  readonly supplierName?: string;
}
