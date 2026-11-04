import type { CsvColumn } from "@/lib/csv";

import type { EcommerceMessages } from "./messages";
import type { OrderRow } from "./recent-orders-table/schema";

export const ORDERS_EXPORT_FILE = "orders.csv";

/** The orders table as a spreadsheet: one row per order the table currently lists, amounts as plain numbers. */
export function orderCsvColumns(text: EcommerceMessages["orders"], currency: string): CsvColumn<OrderRow>[] {
  return [
    { header: text.columns.order, value: (order) => order.id },
    { header: text.columns.customer, value: (order) => order.customer },
    { header: text.columns.date, value: (order) => order.date },
    { header: text.paymentLabel, value: (order) => text.payment[order.payment] },
    { header: text.fulfillmentLabel, value: (order) => text.fulfillment[order.fulfillment] },
    { header: text.itemsLabel, value: (order) => order.itemCount },
    { header: `${text.columns.total} (${currency})`, value: (order) => order.total },
  ];
}
