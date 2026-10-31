import { describe, expect, it } from "vitest";

import { LOCALES } from "@/core/i18n";

import { deals } from "./crm";
import { localizeDeals, localizeDealTitle, translatedDealTitles } from "./crm-text.server";

describe("demo deal titles", () => {
  it.each(deals.map((deal) => [deal.id, deal.title] as const))("deal %s (%s) is translated", (_id, title) => {
    expect(translatedDealTitles).toContain(title);
  });

  it.each(LOCALES)("has a non-empty title for every deal in %s", (locale) => {
    expect(localizeDeals(deals, locale).filter((deal) => deal.title.trim() === "")).toEqual([]);
  });

  it("keeps the English source for en", () => {
    expect(localizeDealTitle("Heat pump retrofit", "en")).toBe("Heat pump retrofit");
  });

  it.each([
    ["es", "Instalación de bomba de calor"],
    ["de", "Nachrüstung einer Wärmepumpe"],
    ["fr", "Installation d’une pompe à chaleur"],
  ] as const)("translates a title into %s", (locale, expected) => {
    expect(localizeDealTitle("Heat pump retrofit", locale)).toBe(expected);
  });

  it("fails loudly for a title nobody translated", () => {
    expect(() => localizeDealTitle("Unknown", "de")).toThrow("No de translation");
  });
});
