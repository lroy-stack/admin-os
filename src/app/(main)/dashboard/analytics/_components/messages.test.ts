import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

import { growthMessages } from "./messages.server";

// LinkedIn and WhatsApp are brand names, so they are the same in every language.
const brands = ["channels.LinkedIn", "channels.WhatsApp"];

describe("Growth Reports dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(growthMessages, brands)).not.toThrow();
  });
});
