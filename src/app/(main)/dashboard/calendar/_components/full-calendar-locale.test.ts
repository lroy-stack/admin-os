import { describe, expect, it } from "vitest";

import { weekStart } from "@/core/i18n";

import { fullCalendarLocale } from "./full-calendar-locale";

describe("fullCalendarLocale", () => {
  it.each(["es", "de", "fr"] as const)("gives FullCalendar a %s pack with the same week start", (locale) => {
    expect(fullCalendarLocale(locale)).toMatchObject({ code: locale, week: { dow: weekStart(locale) } });
  });

  it("leaves English to FullCalendar's built-in locale", () => {
    expect(fullCalendarLocale("en")).toBe("en");
  });
});
