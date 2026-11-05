import { z } from "zod";

import { businessDaySchema } from "@/core/clock";
import { localizedTextSchema } from "@/core/i18n";
import { moneySchema } from "@/core/money";
import { pageInput } from "@/core/pagination";

export const purchaseOrderStatuses = ["draft", "sent", "received", "cancelled"] as const;

/** What the business keeps and buys (ADR 0018 §1). A stock item names itself; its catalog link is a soft reference. */
export const stockItemSchema = z.object({
  id: z.string().min(1),
  name: localizedTextSchema,
  sku: z.string().min(1),
  /** Set only when the business also sells the item (a reference to `catalog`). */
  catalogItemId: z.string().min(1).optional(),
  /** A short word for one piece of it: `unit`, `bottle`, `litre`. */
  unit: z.string().min(1).max(20),
  onHand: z.number().int().nonnegative(),
  reorderPoint: z.number().int().nonnegative(),
  /** A `parties` record with the `supplier` role (ADR 0019 §3). */
  supplierId: z.string().min(1).optional(),
  ext: z.record(z.string(), z.unknown()).optional(),
});

export const purchaseOrderLineSchema = z.object({
  stockItemId: z.string().min(1),
  qty: z.number().int().positive(),
  unitCost: moneySchema,
});

export const purchaseOrderSchema = z.object({
  id: z.string().min(1),
  /** A `parties` record with the `supplier` role; optional per ADR 0019 §3. */
  supplierId: z.string().min(1).optional(),
  status: z.enum(purchaseOrderStatuses),
  lines: z.array(purchaseOrderLineSchema).min(1),
  orderedOn: businessDaySchema,
  expectedOn: businessDaySchema.optional(),
  ext: z.record(z.string(), z.unknown()).optional(),
});

/** The supplier's name as the list shows it: the trade name, else the legal name. Absent when it cannot be resolved. */
const supplierName = { supplierName: z.string().min(1).optional() };

export const stockItemRowSchema = stockItemSchema.extend(supplierName);
export const purchaseOrderRowSchema = purchaseOrderSchema.extend(supplierName);

export const stockListInput = pageInput({ defaultLimit: 50, maxLimit: 200 }).extend({
  /** Only the items whose `onHand` is at or under their `reorderPoint`. */
  belowReorder: z.boolean().optional(),
});

export const ordersListInput = pageInput({ defaultLimit: 50, maxLimit: 200 }).extend({
  status: z.enum(purchaseOrderStatuses).optional(),
});

export type StockItem = z.infer<typeof stockItemSchema>;
export type PurchaseOrder = z.infer<typeof purchaseOrderSchema>;
export type PurchaseOrderStatus = (typeof purchaseOrderStatuses)[number];
export type StockItemRow = z.infer<typeof stockItemRowSchema>;
export type PurchaseOrderRow = z.infer<typeof purchaseOrderRowSchema>;
