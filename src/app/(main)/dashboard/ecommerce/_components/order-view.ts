import type { OrderRow } from "./recent-orders-table/schema";

export const periods = ["thisMonth", "lastMonth", "last30Days", "yearToDate"] as const;
export type EcommercePeriod = (typeof periods)[number];

export const channels = ["all", "onlineStore", "marketplace", "social", "retail"] as const;
export type EcommerceChannel = (typeof channels)[number];

/** The demo's "today": the date the orders of the dataset were taken on. */
export const ORDERS_AS_OF = "2026-05-09";

/** First day (inclusive) and first day after the period (exclusive, `null` when it runs to today), as ISO dates. */
const PERIOD_RANGE: Record<EcommercePeriod, { from: string; before: string | null }> = {
  thisMonth: { from: "2026-05-01", before: null },
  lastMonth: { from: "2026-04-01", before: "2026-05-01" },
  last30Days: { from: "2026-04-09", before: null },
  yearToDate: { from: "2026-01-01", before: null },
};

export const isPeriod = (value: string): value is EcommercePeriod => periods.some((period) => period === value);
export const isChannel = (value: string): value is EcommerceChannel => channels.some((channel) => channel === value);

/** Whether an order's wall-clock date (`2026-05-09T16:42:00`) falls in the period. ISO dates sort as text. */
export function inPeriod(date: string, period: EcommercePeriod): boolean {
  const range = PERIOD_RANGE[period];
  return date >= range.from && (range.before === null || date < range.before);
}

export function ordersFor(orders: readonly OrderRow[], period: EcommercePeriod, channel: EcommerceChannel): OrderRow[] {
  return orders.filter((order) => inPeriod(order.date, period) && (channel === "all" || order.channel === channel));
}

/** A demo contact address for an order's customer: `emma.smith@example.com`. */
export function customerEmail(customer: string): string {
  return `${customer.toLowerCase().replaceAll(/\s+/g, ".")}@example.com`;
}
