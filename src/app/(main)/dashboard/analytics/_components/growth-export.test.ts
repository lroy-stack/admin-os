import { describe, expect, it } from "vitest";

import { getGrowthReport } from "./growth-data";
import { growthExportRows } from "./growth-export";

describe("growthExportRows", () => {
  it("has one row per month of the period", () => {
    expect(growthExportRows(getGrowthReport("3M"))).toHaveLength(3);
  });

  it("carries the months in the order of the report", () => {
    const report = getGrowthReport("6M");
    expect(growthExportRows(report).map((row) => row.month)).toEqual(report.segments.map((segment) => segment.month));
  });

  it("keeps the revenue of each segment", () => {
    const report = getGrowthReport("12M");
    expect(growthExportRows(report).map((row) => row.smb)).toEqual(report.segments.map((segment) => segment.smb));
  });
});
