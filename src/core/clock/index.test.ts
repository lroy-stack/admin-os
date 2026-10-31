import { describe, expect, it } from "vitest";

import { businessClockSchema, type ClockSeed, fixedClock, liveClock } from "./index";

const evening: ClockSeed = {
  businessDay: "2026-10-31",
  nowMin: 20 * 60 + 40,
  cutoffMin: 5 * 60,
  timeZone: "Europe/Madrid",
};

describe("fixedClock", () => {
  it("keeps the business day and the calendar day together in the evening", () => {
    expect(fixedClock(evening)).toEqual({ ...evening, today: "2026-10-31" });
  });

  it("moves the calendar day forward after midnight but before the cut-off", () => {
    expect(fixedClock({ ...evening, nowMin: 60 })).toMatchObject({ businessDay: "2026-10-31", today: "2026-11-01" });
  });

  it("returns a value the clock.get contract accepts", () => {
    expect(businessClockSchema.safeParse(fixedClock(evening)).success).toBe(true);
  });
});

describe("liveClock", () => {
  it.each([
    // 2026-10-31 is the last Saturday before the end of CEST (UTC+2 until 25 Oct; UTC+1 on 31 Oct).
    ["2026-10-31T19:40:00Z", { today: "2026-10-31", businessDay: "2026-10-31", nowMin: 20 * 60 + 40 }],
    ["2026-10-31T23:30:00Z", { today: "2026-11-01", businessDay: "2026-10-31", nowMin: 30 }],
    ["2026-11-01T05:00:00Z", { today: "2026-11-01", businessDay: "2026-11-01", nowMin: 6 * 60 }],
  ])("reads %s in the business time zone", (instant, expected) => {
    expect(liveClock(evening, new Date(instant))).toMatchObject(expected);
  });
});
