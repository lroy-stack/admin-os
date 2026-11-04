import { describe, expect, it } from "vitest";

import { inCashFlowPeriod } from "./cash-flow-periods";

describe("inCashFlowPeriod", () => {
  it("holds only October for this month", () => {
    expect(inCashFlowPeriod("2026-09", "thisMonth")).toBe(false);
  });

  it("starts the last six months in May", () => {
    expect(inCashFlowPeriod("2026-05", "lastSixMonths")).toBe(true);
  });

  it("leaves April out of the last six months", () => {
    expect(inCashFlowPeriod("2026-04", "lastSixMonths")).toBe(false);
  });

  it("stops the year to date at October", () => {
    expect(inCashFlowPeriod("2026-11", "yearToDate")).toBe(false);
  });

  it("keeps the whole year for this year", () => {
    expect(inCashFlowPeriod("2026-12", "thisYear")).toBe(true);
  });
});
