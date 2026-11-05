import { describe, expect, it } from "vitest";

import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatList,
  formatNumber,
  formatRelative,
  formatTime,
  languageName,
} from "@/core/i18n";

const instant = new Date("2026-03-15T23:30:00Z");
const normalize = (text: string) => text.replace(/[  ]/g, " ");

describe("formatNumber", () => {
  it.each([
    ["en", "1,234.5"],
    ["es", "1234,5"],
    ["de", "1.234,5"],
    ["fr", "1 234,5"],
  ] as const)("groups and separates decimals for %s", (locale, expected) => {
    expect(normalize(formatNumber(1234.5, locale))).toBe(expected);
  });
});

describe("formatCurrency", () => {
  it.each([
    ["EUR", 123_456, "en", "€1,234.56"],
    ["EUR", 123_456, "de", "1.234,56 €"],
    ["JPY", 1234, "en", "¥1,234"],
    ["KWD", 1_234_567, "en", "KWD 1,234.567"],
    ["USD", 123_456, "fr", "1 234,56 $"],
  ] as const)("reads minor digits of %s: %i in %s", (currency, minor, locale, expected) => {
    expect(normalize(formatCurrency(minor, currency, locale))).toBe(expected);
  });
});

describe("date and time formatting", () => {
  it.each([
    ["Europe/Madrid", "es", "16 mar 2026"],
    ["America/New_York", "en", "Mar 15, 2026"],
  ] as const)("formats the date in the %s time zone", (timeZone, locale, expected) => {
    expect(formatDate(instant, locale, timeZone)).toBe(expected);
  });

  it.each([
    ["Europe/Madrid", "en", "12:30 AM"],
    ["UTC", "de", "23:30"],
  ] as const)("formats the time in %s", (timeZone, locale, expected) => {
    expect(normalize(formatTime(instant, locale, timeZone))).toBe(expected);
  });

  it("formats date and time together", () => {
    expect(normalize(formatDateTime(instant, "en", "UTC"))).toBe("Mar 15, 2026, 11:30 PM");
  });

  it("honours caller options instead of the default styles", () => {
    expect(formatDate(instant, "en", "UTC", { year: "numeric" })).toBe("2026");
  });
});

describe("formatRelative", () => {
  const now = new Date("2026-03-15T12:00:00Z");
  it.each([
    [new Date("2026-03-15T11:59:30Z"), "en", "30 seconds ago"],
    [new Date("2026-03-15T09:00:00Z"), "en", "3 hours ago"],
    [new Date("2026-03-14T12:00:00Z"), "en", "yesterday"],
    [new Date("2026-03-14T12:00:00Z"), "de", "gestern"],
    [new Date("2026-03-14T12:00:00Z"), "fr", "hier"],
    [new Date("2026-03-18T12:00:00Z"), "es", "dentro de 3 días"],
    [new Date("2026-03-15T12:00:00Z"), "en", "now"],
    [new Date("2024-03-15T12:00:00Z"), "en", "2 years ago"],
  ] as const)("describes %s for %s", (value, locale, expected) => {
    expect(formatRelative(value, now, locale)).toBe(expected);
  });
});

describe("formatList", () => {
  it.each([
    ["en", "a, b, and c"],
    ["es", "a, b y c"],
    ["de", "a, b und c"],
    ["fr", "a, b et c"],
  ] as const)("joins with the %s conjunction", (locale, expected) => {
    expect(formatList(["a", "b", "c"], locale)).toBe(expected);
  });
});

describe("languageName", () => {
  it.each([
    ["es", "en", "Spanish"],
    ["es", "de", "Spanisch"],
    ["fr", "es", "francés"],
  ] as const)("names %s in %s as %s", (code, locale, expected) => {
    expect(languageName(code, locale)).toBe(expected);
  });

  it("falls back to the code when it is not a language", () => {
    expect(languageName("not a code", "en")).toBe("not a code");
  });
});
