import { describe, expect, it } from "vitest";

import { matchesOrderFilter } from "./columns";
import type { OrderFilter, OrderRow } from "./schema";

const order = (payment: OrderRow["payment"], fulfillment: OrderRow["fulfillment"]): OrderRow => ({
  id: "#1",
  date: "2026-05-09T16:42:00",
  customer: "Emma Smith",
  channel: "social",
  payment,
  total: 10,
  itemCount: 1,
  fulfillment,
});

describe("order status filters", () => {
  it.each<[OrderFilter, OrderRow["payment"], OrderRow["fulfillment"], boolean]>([
    ["all", "paid", "fulfilled", true],
    ["needsAction", "paid", "fulfilled", false],
    ["needsAction", "pending", "unfulfilled", true],
    ["needsAction", "refunded", "returned", true],
    ["unfulfilled", "paid", "unfulfilled", true],
    ["unfulfilled", "pending", "fulfilled", false],
    ["unpaid", "pending", "unfulfilled", true],
    ["unpaid", "paid", "unfulfilled", false],
    ["returns", "refunded", "returned", true],
    ["returns", "paid", "fulfilled", false],
  ])("%s with %s and %s matches: %s", (filter, payment, fulfillment, expected) => {
    expect(matchesOrderFilter(order(payment, fulfillment), filter)).toBe(expected);
  });
});
