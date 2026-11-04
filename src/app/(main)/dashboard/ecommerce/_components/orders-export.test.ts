import { describe, expect, it } from "vitest";

import { toCsv } from "@/lib/csv";

import { ecommerceMessages } from "./messages.server";
import { orderCsvColumns } from "./orders-export";
import type { OrderRow } from "./recent-orders-table/schema";

const order: OrderRow = {
  id: "#14550",
  date: "2026-05-09T16:42:00",
  customer: "Emma Smith",
  channel: "social",
  payment: "pending",
  total: 248,
  itemCount: 2,
  fulfillment: "unfulfilled",
};

describe("orderCsvColumns", () => {
  const csv = toCsv([order], orderCsvColumns(ecommerceMessages.en.orders, "EUR"));
  const [header, row] = csv.split("\r\n");

  it("names the columns in the dictionary's words and the business currency", () => {
    expect(header).toContain('"Total (EUR)"');
  });

  it("writes the order with its labels and the total as a number", () => {
    expect(row).toBe('"#14550","Emma Smith","2026-05-09T16:42:00","Pending","Unfulfilled","2","248"');
  });
});
