import { describe, expect, it } from "vitest";

import { addCalendarDays, todayIso } from "./calendar-days";

describe("calendar days", () => {
  it("reads the day from the instant in UTC", () => {
    expect(todayIso(new Date("2026-10-31T23:30:00Z"))).toBe("2026-10-31");
  });

  it.each([
    ["2026-10-31", 1, "2026-11-01"],
    ["2026-03-01", -1, "2026-02-28"],
    ["2028-02-28", 2, "2028-03-01"],
    ["2026-12-25", 9, "2027-01-03"],
  ])("moves %s by %i days to %s", (isoDate, days, expected) => {
    expect(addCalendarDays(isoDate, days)).toBe(expected);
  });
});
