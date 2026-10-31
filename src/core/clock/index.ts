import { z } from "zod";

import { defineCapability } from "@/core/capability";

/** The business day a time belongs to (YYYY-MM-DD). A late-night slot stays on the day it opened. */
export const businessDaySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** Minutes from midnight of a business day. 1440 is allowed so a slot can end exactly at midnight. */
export const minuteOfDaySchema = z.number().int().min(0).max(1440);

/** Check for `.refine` on any object with a minute window. Kept out of the schemas so they stay `.omit`-able. */
export const endAfterStart = (window: { startMin: number; endMin: number }) => window.endMin > window.startMin;

export const endAfterStartIssue = { message: "endMin must be after startMin", path: ["endMin"] };

/** What a preset seed pins: the demo's frozen moment and where the business day turns over. */
export const clockSeedSchema = z.object({
  businessDay: businessDaySchema,
  nowMin: minuteOfDaySchema,
  /** Minutes after midnight before which a time still belongs to the previous business day (late-night service). */
  cutoffMin: minuteOfDaySchema,
  timeZone: z.string().min(1),
});

export type ClockSeed = z.infer<typeof clockSeedSchema>;

/** The answer of `clock.get` (ADR 0005): server and client render the same moment. */
export const businessClockSchema = clockSeedSchema.extend({ today: businessDaySchema });

export type BusinessClock = z.infer<typeof businessClockSchema>;

export const clockGet = defineCapability({
  id: "clock.get",
  summary: "The business clock: today, the business day, minutes since midnight and the time zone.",
  input: z.strictObject({}),
  output: businessClockSchema,
  permission: "read:clock",
  effect: "read",
});

export const clockCapabilities = { "clock.get": clockGet } as const;

/** The seed's frozen moment. Before the cut-off the calendar day is already the next one. */
export function fixedClock(seed: ClockSeed): BusinessClock {
  const today = seed.nowMin < seed.cutoffMin ? addDays(seed.businessDay, 1) : seed.businessDay;
  return { ...seed, today };
}

/** Real time in the seed's time zone (`MOCK_CLOCK=live`). */
export function liveClock(seed: ClockSeed, now: Date): BusinessClock {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: seed.timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );
  const today = `${parts.year}-${parts.month}-${parts.day}`;
  const nowMin = Number(parts.hour) * 60 + Number(parts.minute);
  const businessDay = nowMin < seed.cutoffMin ? addDays(today, -1) : today;
  return { businessDay, today, nowMin, cutoffMin: seed.cutoffMin, timeZone: seed.timeZone };
}

/** Calendar arithmetic on `YYYY-MM-DD`, in UTC so no local offset or DST can shift the date. */
function addDays(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
