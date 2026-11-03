import { describe, expect, it } from "vitest";

import type { OpenDeal } from "@/lib/crm";
import { toCsv } from "@/lib/csv";

import { dealCsvColumns } from "./deal-export";

const headers = {
  deal: "Deal",
  customer: "Customer",
  stage: "Stage",
  closes: "Closes",
  owners: "Owners",
  value: "Value",
  currency: "Currency",
};
const stages = { qualification: "Qualification", proposal: "Proposal", negotiation: "Negotiation", closing: "Closing" };
const deal: OpenDeal = {
  id: "d",
  title: "Solar, 40 bays",
  customerId: "c01",
  stage: "proposal",
  value: 12290,
  closeDate: "2026-12-06",
  ownerIds: ["iv", "km"],
};

const lines = (rows: OpenDeal[]) => toCsv(rows, dealCsvColumns(headers, stages, "EUR")).split("\r\n");

describe("the deals export", () => {
  it("starts with the translated header", () => {
    expect(lines([deal])[0]).toBe('"Deal","Customer","Stage","Closes","Owners","Value","Currency"');
  });

  it("writes one row per deal with the stage name, ISO date, owners and the number", () => {
    expect(lines([deal])[1]).toBe(
      '"Solar, 40 bays","Northgate Cold Chain","Proposal","2026-12-06","Iris Vega; Kofi Mensah","12290","EUR"',
    );
  });

  it("guards a title a spreadsheet would read as a formula", () => {
    expect(lines([{ ...deal, title: "=SUM(A1)" }])[1]).toMatch(/^"'=SUM\(A1\)",/);
  });

  it("is only the header when no deal is visible", () => {
    expect(lines([])).toHaveLength(1);
  });
});
