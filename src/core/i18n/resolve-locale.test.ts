import { describe, expect, it } from "vitest";

import { resolveLocale } from "@/core/i18n";

describe("resolveLocale", () => {
  it.each([
    ["a valid cookie beats the header", "fr", "de", "fr"],
    ["an invalid cookie is ignored", "xx", "de", "de"],
    ["an empty cookie is ignored", "", "es", "es"],
    ["a regional tag matches its base language", undefined, "de-AT;q=0.9", "de"],
    ["q order wins over header order", undefined, "fr;q=0.4, es;q=0.8, en;q=0.1", "es"],
    ["the first of equal q wins", undefined, "de, fr", "de"],
    ["unsupported languages are skipped", undefined, "ja, zh;q=0.9, fr;q=0.5", "fr"],
    ["q=0 is refused", undefined, "es;q=0, de;q=0.1", "de"],
    ["a malformed q is ignored", undefined, "es;q=abc, fr;q=0.2", "fr"],
    ["case is not significant", undefined, "ES-es", "es"],
    ["no match falls back to the default", undefined, "ja, zh", "en"],
    ["no input falls back to the default", undefined, undefined, "en"],
    ["null inputs fall back to the default", null, null, "en"],
  ] as const)("%s", (_name, cookie, acceptLanguage, expected) => {
    expect(resolveLocale({ cookie, acceptLanguage, defaultLocale: "en" })).toBe(expected);
  });

  it("returns the configured default, not a hard-coded one", () => {
    expect(resolveLocale({ defaultLocale: "es" })).toBe("es");
  });
});
