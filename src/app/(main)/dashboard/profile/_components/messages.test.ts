import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

import { profileMessages } from "./messages.server";
import { profileFacts } from "./profile-data";

// Identical on purpose: both only join values (a date range with a dash, a name and a relation with a dot).
const SAME_EVERYWHERE = ["values.dateRange", "values.contact"];

describe("profile dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(profileMessages, SAME_EVERYWHERE)).not.toThrow();
  });

  it.each(["en", "es", "de", "fr"] as const)("has text for every document of the profile in %s", (locale) => {
    const ids = profileFacts.documents.map((document) => document.id);

    expect(Object.keys(profileMessages[locale].demo.documents).sort()).toEqual([...ids].sort());
  });
});
