import { describe, expect, it } from "vitest";

import { spendingSeries, weekLedger } from "./spending-data";

describe("spendingSeries", () => {
  it("holds 30 points for the week", () => {
    expect(spendingSeries("weekly").points).toHaveLength(30);
  });

  it("holds one point per day for the month", () => {
    expect(spendingSeries("monthly").points).toHaveLength(30);
  });

  it("holds one point per month for the year", () => {
    expect(spendingSeries("yearly").points).toHaveLength(12);
  });

  it("keeps the points of every period inside its domain", () => {
    const outside = (["weekly", "monthly", "yearly"] as const).flatMap((period) => {
      const { points, domain } = spendingSeries(period);
      return points.filter((point) => point.timestamp < domain[0] || point.timestamp > domain[1]);
    });
    expect(outside).toEqual([]);
  });
});

describe("weekLedger", () => {
  it("lists a row per expense and per income, latest first", () => {
    const rows = weekLedger();
    expect(rows).toHaveLength(34);
    expect(rows[0]?.timestamp).toBeGreaterThanOrEqual(rows.at(-1)?.timestamp ?? 0);
  });
});
