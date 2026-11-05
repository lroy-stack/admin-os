import { describe, expect, it } from "vitest";

import { assertDictionaryParity, LOCALES, type Locale, type Terms } from "@/core/i18n";
import { hospitalityTerms } from "@/verticals/hospitality/server";
import { salonTerms } from "@/verticals/salon/server";
import { workshopTerms } from "@/verticals/workshop/server";

import { termLabel } from "./vocabulary.server";

describe("termLabel", () => {
  it.each([
    { locale: "en", text: "Host" },
    { locale: "es", text: "Anfitrión" },
    { locale: "de", text: "Empfang" },
    { locale: "fr", text: "Accueil" },
  ] as const)("words the hospitality skill 'host' in $locale", ({ locale, text }) => {
    expect(termLabel("hospitality", locale, "skills", "host")).toBe(text);
  });

  it.each(LOCALES)("shows a skill a business typed itself as typed, in %s", (locale) => {
    expect(termLabel("hospitality", locale, "skills", "latte_art")).toBe("latte_art");
  });

  it("does not throw or invent words for names that exist on every object", () => {
    expect(termLabel("salon", "en", "skills", "constructor")).toBe("constructor");
  });

  it("does not use another preset's words", () => {
    expect(termLabel("salon", "en", "skills", "host")).toBe("host");
  });
});

/** Words that are the same in every language on purpose; nothing else may be. */
const SAME_EVERYWHERE = { hospitality: ["skills.sommelier"], salon: [], workshop: [] } as const;

describe.each([
  ["hospitality", hospitalityTerms],
  ["salon", salonTerms],
  ["workshop", workshopTerms],
] as const satisfies readonly (readonly [keyof typeof SAME_EVERYWHERE, Terms])[])("%s terms", (preset, terms) => {
  it("pass the dictionary parity check", () => {
    const byLocale = Object.fromEntries(
      LOCALES.map((locale: Locale) => [
        locale,
        Object.fromEntries(
          Object.entries(terms).flatMap(([family, words]) =>
            Object.entries(words).map(([id, label]) => [`${family}.${id}`, (label as Record<Locale, string>)[locale]]),
          ),
        ),
      ]),
    ) as Record<Locale, unknown>;
    expect(() => assertDictionaryParity(byLocale, SAME_EVERYWHERE[preset])).not.toThrow();
  });
});
