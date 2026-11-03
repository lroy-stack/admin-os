import { describe, expect, it } from "vitest";

import { toCsv } from "@/lib/csv";

import { type CustomerRow, csvColumns, majorUnits, visibleRows } from "./directory-model";
import { customerDirectoryMessages } from "./messages.server";

const row = (overrides: Partial<CustomerRow> & Pick<CustomerRow, "id" | "name">): CustomerRow => ({
  tags: [],
  vip: false,
  blocked: false,
  visits: 0,
  spend: null,
  lastVisit: null,
  ...overrides,
});

const ana = row({
  id: "a",
  name: "Ana",
  phone: "+34600000101",
  visits: 3,
  spend: { amountMinor: 15000, currency: "EUR" },
  lastVisit: "2026-10-01T00:00:00Z",
});
const bea = row({ id: "b", name: "Bea", email: "bea@example.com", vip: true, tags: ["Regular"], visits: 9 });
const carl = row({
  id: "c",
  name: "Carl",
  blocked: true,
  visits: 1,
  spend: { amountMinor: 90000, currency: "EUR" },
  lastVisit: "2026-10-20T00:00:00Z",
});
const rows = [carl, ana, bea];
const base = { query: "", status: "all", sort: "name", locale: "en" } as const;
const names = (list: readonly CustomerRow[]) => list.map((item) => item.name);

describe("visibleRows", () => {
  it("sorts A to Z by default and does not change its input", () => {
    expect(names(visibleRows(rows, base))).toEqual(["Ana", "Bea", "Carl"]);
    expect(names(rows)).toEqual(["Carl", "Ana", "Bea"]);
  });

  it("puts the most recent visit first and customers who never came last", () => {
    expect(names(visibleRows(rows, { ...base, sort: "lastVisit" }))).toEqual(["Carl", "Ana", "Bea"]);
  });

  it("sorts by visits, highest first", () => {
    expect(names(visibleRows(rows, { ...base, sort: "visits" }))).toEqual(["Bea", "Ana", "Carl"]);
  });

  it("sorts by spend, highest first, with no spend last", () => {
    expect(names(visibleRows(rows, { ...base, sort: "spend" }))).toEqual(["Carl", "Ana", "Bea"]);
  });

  it("filters to VIP customers", () => {
    expect(names(visibleRows(rows, { ...base, status: "vip" }))).toEqual(["Bea"]);
  });

  it("filters to blocked customers", () => {
    expect(names(visibleRows(rows, { ...base, status: "blocked" }))).toEqual(["Carl"]);
  });

  it("searches the name without regard to case", () => {
    expect(names(visibleRows(rows, { ...base, query: "  cARL " }))).toEqual(["Carl"]);
  });

  it("searches the email", () => {
    expect(names(visibleRows(rows, { ...base, query: "example.com" }))).toEqual(["Bea"]);
  });

  it("searches the tags", () => {
    expect(names(visibleRows(rows, { ...base, query: "regular" }))).toEqual(["Bea"]);
  });

  it("finds a phone typed with spaces", () => {
    expect(names(visibleRows(rows, { ...base, query: "600 00 01 01" }))).toEqual(["Ana"]);
  });

  it("combines the search with the status filter", () => {
    expect(names(visibleRows(rows, { ...base, status: "vip", query: "ana" }))).toEqual([]);
  });
});

describe("majorUnits", () => {
  it("uses two decimals for euros", () => {
    expect(majorUnits(15050, "EUR")).toBe(150.5);
  });

  it("uses none for yen", () => {
    expect(majorUnits(1500, "JPY")).toBe(1500);
  });
});

describe("the exported file", () => {
  const csv = toCsv(visibleRows(rows, base), csvColumns(customerDirectoryMessages.en.csv)).split("\r\n");

  it("starts with the translated header", () => {
    expect(csv[0]).toBe('"Name","Email","Phone","Tags","VIP","Blocked","Visits","Spend","Currency","Last visit"');
  });

  // A leading "+" is guarded against spreadsheet formulas by the CSV writer (K10), so the phone gets an apostrophe.
  it("writes a customer with all its figures", () => {
    expect(csv[1]).toBe('"Ana","","\'+34600000101","","No","No","3","150","EUR","2026-10-01"');
  });

  it("leaves spend and date empty for a customer who never came", () => {
    expect(csv[2]).toBe('"Bea","bea@example.com","","Regular","Yes","No","9","","",""');
  });

  it("has one line per visible customer plus the header", () => {
    expect(csv).toHaveLength(4);
  });
});
