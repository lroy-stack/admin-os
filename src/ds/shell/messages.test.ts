import { describe, expect, it } from "vitest";

import { assertDictionaryParity, LOCALE_NAMES, LOCALES } from "@/core/i18n";

import { shellMessages } from "./server";

describe("shell dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(shellMessages)).not.toThrow();
  });
});

describe("language picker", () => {
  it("offers exactly the kit's locales", () => {
    expect(Object.keys(LOCALE_NAMES)).toEqual([...LOCALES]);
  });

  it.each(LOCALES)("names %s by its endonym", (locale) => {
    const endonym = new Intl.DisplayNames([locale], { type: "language" }).of(locale) ?? "";
    expect(LOCALE_NAMES[locale]).toBe(endonym.charAt(0).toLocaleUpperCase(locale) + endonym.slice(1));
  });
});
