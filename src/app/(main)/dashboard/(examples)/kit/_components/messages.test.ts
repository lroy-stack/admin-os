import { describe, expect, it } from "vitest";

import { assertDictionaryParity, LOCALES } from "@/core/i18n";

import { kitMessages } from "./messages.server";

// Identical on purpose: names of demo places and people that all four languages write the same way.
const SAME_EVERYWHERE = ["panel.panelTitle", "quick.nameLabel", "form.nameLabel"];

describe("kit dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(kitMessages, SAME_EVERYWHERE)).not.toThrow();
  });

  // The owner keeps "Walk-in" untranslated in every language (docs/i18n/glossary.md), as the bookings dictionary does.
  it.each(LOCALES)("keeps the term Walk-in untranslated in %s", (locale) => {
    const { open, windowTitle, submit } = kitMessages[locale].quick;

    expect([open, windowTitle, submit].map((label) => /walk-in/i.test(label))).toEqual([true, true, true]);
  });
});
