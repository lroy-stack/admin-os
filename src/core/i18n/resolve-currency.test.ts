import { describe, expect, it } from "vitest";

import { resolveCurrency } from "@/core/i18n";

describe("resolveCurrency", () => {
  it.each([
    ["a valid cookie wins over the header", "GBP", "es-ES", "GBP"],
    ["an invalid cookie is ignored", "JPY", "es-ES", "EUR"],
    ["an empty cookie is ignored", "", "en-GB", "GBP"],
    ["es-ES gives EUR", undefined, "es-ES", "EUR"],
    ["de-DE gives EUR", undefined, "de-DE,de;q=0.9", "EUR"],
    ["fr-FR gives EUR", undefined, "fr-FR", "EUR"],
    ["de-AT is in the euro area", undefined, "de-AT", "EUR"],
    ["en-GB gives GBP", undefined, "en-GB,en;q=0.8", "GBP"],
    ["en-US gives USD", undefined, "en-US", "USD"],
    ["fr-CH has no offered currency, so the default applies", undefined, "fr-CH", "USD"],
    ["a tag without a region says nothing", undefined, "de", "USD"],
    ["q order decides between regions", undefined, "en-US;q=0.4, es-ES;q=0.9", "EUR"],
    ["an unknown region is skipped for the next tag", undefined, "ja-JP, en-GB;q=0.5", "GBP"],
    ["a script subtag is not a region", undefined, "zh-Hant-TW", "USD"],
    ["q=0 is refused", undefined, "es-ES;q=0, en-GB;q=0.1", "GBP"],
    ["no input falls back to the default", undefined, undefined, "USD"],
    ["null inputs fall back to the default", null, null, "USD"],
  ] as const)("%s", (_name, cookie, acceptLanguage, expected) => {
    expect(resolveCurrency({ cookie, acceptLanguage, defaultCurrency: "USD" })).toBe(expected);
  });

  it("returns the configured default, not a hard-coded one", () => {
    expect(resolveCurrency({ defaultCurrency: "EUR" })).toBe("EUR");
  });
});
