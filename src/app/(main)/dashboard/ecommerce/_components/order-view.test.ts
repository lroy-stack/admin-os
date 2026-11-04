import { describe, expect, it } from "vitest";

import { customerEmail, inPeriod, ordersFor } from "./order-view";
import type { OrderRow } from "./recent-orders-table/schema";

const order = (id: string, date: string, channel: OrderRow["channel"]): OrderRow => ({
  id,
  date,
  channel,
  customer: "Emma Smith",
  payment: "paid",
  total: 10,
  itemCount: 1,
  fulfillment: "fulfilled",
});

const orders = [
  order("a", "2026-05-09T16:42:00", "social"),
  order("b", "2026-04-23T10:26:00", "retail"),
  order("c", "2026-02-02T09:00:00", "social"),
];

describe("inPeriod", () => {
  it("puts May in this month", () => {
    expect(inPeriod("2026-05-09T16:42:00", "thisMonth")).toBe(true);
  });

  it("keeps May out of last month", () => {
    expect(inPeriod("2026-05-09T16:42:00", "lastMonth")).toBe(false);
  });

  it("puts April in last month", () => {
    expect(inPeriod("2026-04-23T10:26:00", "lastMonth")).toBe(true);
  });

  it("counts April 23 among the last 30 days", () => {
    expect(inPeriod("2026-04-23T10:26:00", "last30Days")).toBe(true);
  });
});

describe("ordersFor", () => {
  it("keeps every channel for all channels", () => {
    expect(ordersFor(orders, "yearToDate", "all").map((row) => row.id)).toEqual(["a", "b", "c"]);
  });

  it("narrows to the channel and the period together", () => {
    expect(ordersFor(orders, "yearToDate", "social").map((row) => row.id)).toEqual(["a", "c"]);
  });

  it("returns nothing when no order fits", () => {
    expect(ordersFor(orders, "lastMonth", "social")).toEqual([]);
  });
});

describe("customerEmail", () => {
  it("builds a demo address from the name", () => {
    expect(customerEmail("Emma  Smith")).toBe("emma.smith@example.com");
  });
});
