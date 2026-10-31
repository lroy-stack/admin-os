import { describe, expect, it } from "vitest";

import { defineMessages, format, LOCALES, type Locale, type Plural } from "@/core/i18n";

const count: Plural = { zero: "No tables", one: "{count} table", other: "{count} tables" };
const noZero: Plural = { one: "{count} item", other: "{count} items", many: "{count} of items" };

describe("defineMessages", () => {
  it("returns the dictionary unchanged", () => {
    const dictionary = { en: { a: "A" }, es: { a: "A" }, de: { a: "A" }, fr: { a: "A" } };
    expect(defineMessages<{ a: string }>(dictionary)).toBe(dictionary);
  });

  it("rejects a dictionary without every locale at compile time", () => {
    // @ts-expect-error de and fr are missing
    defineMessages<{ a: string }>({ en: { a: "A" }, es: { a: "A" } });
    expect(true).toBe(true);
  });

  it("rejects a locale constant without every key at compile time", () => {
    // @ts-expect-error key "b" is missing
    const en: { a: string; b: string } = { a: "A" };
    expect(en.a).toBe("A");
  });
});

describe("format", () => {
  it("fills named placeholders", () => {
    expect(format("Late by {minutes} min, {name}", "en", { minutes: 5, name: "Ana" })).toBe("Late by 5 min, Ana");
  });

  it.each([
    ["en", "1,234"],
    ["de", "1.234"],
    ["fr", "1\u202f234"],
  ] as const)("writes a numeric placeholder for the %s locale", (locale, written) => {
    expect(format("{n} guests", locale, { n: 1234 })).toBe(`${written} guests`);
  });

  it("prints a string param exactly as given, so a year or an id is not grouped", () => {
    expect(format("Year {year}", "de", { year: "2026" })).toBe("Year 2026");
  });

  it("leaves an unknown placeholder visible instead of hiding it", () => {
    expect(format("Hello {name}", "en", {})).toBe("Hello {name}");
  });

  it("throws when a plural has no numeric count", () => {
    expect(() => format(count, "en", {})).toThrow(TypeError);
  });

  it.each([
    ["en", 0, "No tables"],
    ["fr", 0, "No tables"],
  ] as const)("an explicit zero wins for count 0 in %s", (locale, n, expected) => {
    expect(format(count, locale, { count: n })).toBe(expected);
  });

  it.each([
    ["en", 1, "1 item"],
    ["en", 2, "2 items"],
    ["de", 1, "1 item"],
    ["de", 1_000_000, "1.000.000 items"],
    ["fr", 0, "0 item"],
    ["fr", 1, "1 item"],
    ["fr", 2, "2 items"],
    ["es", 1, "1 item"],
    ["es", 2, "2 items"],
    ["es", 1_000_000, "1.000.000 of items"],
    ["fr", 1_000_000, "1\u202f000\u202f000 of items"],
  ] as const)("selects the %s plural form for %i like Intl.PluralRules", (locale, n, expected) => {
    expect(format(noZero, locale, { count: n })).toBe(expected);
  });

  it.each(LOCALES.map((locale) => [locale] as [Locale]))(
    "plural category for 5 in %s agrees with Intl.PluralRules",
    (locale) => {
      const category = new Intl.PluralRules(locale).select(5);
      const forms: Plural = { one: "one", other: "other", few: "few", many: "many", two: "two" };
      expect(format(forms, locale, { count: 5 })).toBe(forms[category]);
    },
  );

  it("falls back to other when the category has no form", () => {
    expect(format({ one: "x", other: "{count} others" }, "es", { count: 1_000_000 })).toBe("1.000.000 others");
  });
});
