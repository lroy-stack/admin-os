import type { Locale, LocalizedText } from "@/core/i18n";
import type { ViewLoader } from "@/core/views";
import { readAllRows } from "@/core/views/server";

import { type PurchaseOrderRow, purchaseOrderRowSchema, type StockItemRow, stockItemRowSchema } from "./schema";
import type { OrderRow, StockRow } from "./views/model";

const nameIn = (name: LocalizedText, locale: Locale) => name.translations[locale] ?? name.source;

const supplierOf = ({ supplierName }: { readonly supplierName?: string | undefined }) =>
  supplierName === undefined ? {} : { supplierName };

/** The `inventory.stock` loader (ADR 0018 §3): every stock item, with its supplier's name when it has one. */
export const loadStock: ViewLoader = (context) =>
  readAllRows(context, {
    capability: "inventory.stock.list",
    input: {},
    item: stockItemRowSchema,
    row: (item: StockItemRow): StockRow => ({
      id: item.id,
      name: nameIn(item.name, context.locale),
      sku: item.sku,
      onHand: item.onHand,
      unit: item.unit,
      belowReorder: item.onHand <= item.reorderPoint,
      ...supplierOf(item),
    }),
  });

/** The `inventory.orders` loader (ADR 0018 §3): every purchase order, its total summed from its lines. */
export const loadOrders: ViewLoader = (context) =>
  readAllRows(context, {
    capability: "inventory.orders.list",
    input: {},
    item: purchaseOrderRowSchema,
    row: (order: PurchaseOrderRow): OrderRow => ({
      id: order.id,
      status: order.status,
      orderedOn: order.orderedOn,
      ...(order.expectedOn === undefined ? {} : { expectedOn: order.expectedOn }),
      total: {
        amountMinor: order.lines.reduce((sum, line) => sum + line.qty * line.unitCost.amountMinor, 0),
        currency: order.lines[0]?.unitCost.currency ?? "",
      },
      ...supplierOf(order),
    }),
  });
