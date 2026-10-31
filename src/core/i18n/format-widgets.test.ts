import { describe, expect, it } from "vitest";

import {
  chartFormatters,
  formatAmount,
  formatCalendarDate,
  formatCompact,
  formatLocalDate,
  formatPercent,
  LOCALES,
  monthNames,
  weekdayNames,
  weekdayNamesFromWeekStart,
  weekStart,
} from "@/core/i18n";

import { dateFnsLocale, fullCalendarLocale } from "./ui";

// TypeScript's lib does not declare `Intl.Locale#getWeekInfo` yet; Node 24 has it.
interface WeekInfoLocale {
  getWeekInfo(): { firstDay: number };
}

const normalize = (text: string) => text.replace(/[  ]/g, " ");

describe("formatAmount", () => {
  it.each([
    ["en", { compact: true }, "$258.6K"],
    ["es", { compact: true }, "258,6 mil US$"],
    ["fr", { compact: true }, "258,6 k $US"],
    ["en", { fractionDigits: 0 }, "$258,600"],
    ["de", { fractionDigits: 0 }, "258.600 $"],
    ["en", {}, "$258,600.00"],
  ] as const)("formats 258600 USD in %s with %o", (locale, options, expected) => {
    expect(normalize(formatAmount(258_600, "USD", locale, options))).toBe(expected);
  });

  it("takes the currency from the data, not from the locale", () => {
    expect(normalize(formatAmount(1200, "EUR", "en", { fractionDigits: 0 }))).toBe("€1,200");
  });
});

describe("formatCompact", () => {
  it.each([
    ["en", "1.2M"],
    ["de", "1,2 Mio."],
    ["es", "1,2 M"],
  ] as const)("shortens 1 234 567 in %s", (locale, expected) => {
    expect(normalize(formatCompact(1_234_567, locale))).toBe(expected);
  });
});

describe("formatPercent", () => {
  it.each([
    ["en", "64%"],
    ["de", "64 %"],
    ["fr", "64 %"],
  ] as const)("writes 0.64 in %s", (locale, expected) => {
    expect(normalize(formatPercent(0.64, locale))).toBe(expected);
  });

  it.each([
    [0.12, "+12%"],
    [-0.05, "-5%"],
    [0, "0%"],
  ] as const)("signs a change of %d", (ratio, expected) => {
    expect(formatPercent(ratio, "en", { signed: true })).toBe(expected);
  });

  it("honours fraction digits", () => {
    expect(formatPercent(0.1234, "en", { fractionDigits: 1 })).toBe("12.3%");
  });
});

describe("calendar dates", () => {
  it.each([
    ["en", "Oct 31, 2026"],
    ["es", "31 oct 2026"],
    ["de", "31.10.2026"],
    ["fr", "31 oct. 2026"],
  ] as const)("names the day in %s", (locale, expected) => {
    expect(formatCalendarDate("2026-10-31", locale)).toBe(expected);
  });

  it("does not shift with the device zone", () => {
    expect(formatCalendarDate("2026-01-01", "en", { day: "numeric" })).toBe("1");
  });

  it("formats a picker date in the device zone", () => {
    expect(formatLocalDate(new Date(2026, 9, 31, 0, 30), "en", { day: "numeric", month: "short" })).toBe("Oct 31");
  });
});

describe("month and weekday names", () => {
  it.each([
    ["en", "October"],
    ["es", "octubre"],
    ["de", "Oktober"],
    ["fr", "octobre"],
  ] as const)("names October in %s", (locale, expected) => {
    expect(monthNames(locale)[9]).toBe(expected);
  });

  it.each(LOCALES)("lists twelve months and seven weekdays in %s", (locale) => {
    expect([monthNames(locale).length, weekdayNames(locale).length]).toEqual([12, 7]);
  });

  it("indexes weekdays like Date#getDay (Sunday is 0)", () => {
    expect(weekdayNames("en", "short")[0]).toBe("Sun");
  });

  it.each([
    ["en", "Sun"],
    ["es", "lun"],
    ["de", "Mo"],
    ["fr", "lun."],
  ] as const)("starts the column order of %s on %s", (locale, first) => {
    expect(weekdayNamesFromWeekStart(locale, "short")[0]).toBe(first);
  });
});

describe("weekStart", () => {
  it.each(LOCALES)("agrees with the CLDR week data for %s", (locale) => {
    // Intl numbers days 1 to 7 from Monday; Date#getDay numbers them 0 to 6 from Sunday.
    expect(weekStart(locale)).toBe((new Intl.Locale(locale) as unknown as WeekInfoLocale).getWeekInfo().firstDay % 7);
  });
});

describe("widget locale packs", () => {
  it.each(LOCALES)("gives date-fns a pack that starts the week like weekStart for %s", (locale) => {
    expect(dateFnsLocale(locale).options?.weekStartsOn).toBe(weekStart(locale));
  });

  it.each(LOCALES)("gives date-fns a pack whose code starts with %s", (locale) => {
    expect(dateFnsLocale(locale).code?.startsWith(locale)).toBe(true);
  });

  it.each(["es", "de", "fr"] as const)("gives FullCalendar a %s pack with the same week start", (locale) => {
    expect(fullCalendarLocale(locale)).toMatchObject({ code: locale, week: { dow: weekStart(locale) } });
  });

  it("leaves English to FullCalendar's built-in locale", () => {
    expect(fullCalendarLocale("en")).toBe("en");
  });
});

describe("chartFormatters", () => {
  const fmt = chartFormatters("de", "USD");

  it("shortens legend amounts and spells tooltip amounts out", () => {
    expect([normalize(fmt.currencyCompact(200_000)), normalize(fmt.currency(258_600))]).toEqual([
      "200.000 $",
      "258.600 $",
    ]);
  });

  it("reads months and days from ISO strings", () => {
    expect([fmt.month("2026-05"), fmt.day("2026-05-14")]).toEqual(["Mai", "14. Mai"]);
  });

  it("formats percentages and compact numbers for the locale", () => {
    expect([normalize(fmt.percent(0.5)), normalize(fmt.compact(2_500_000))]).toEqual(["50 %", "2,5 Mio."]);
  });
});
