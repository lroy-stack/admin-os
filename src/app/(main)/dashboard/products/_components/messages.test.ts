import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

import { productsMessages } from "./messages.server";

// Identical on purpose: SKU is the same abbreviation in every language.
const SAME_EVERYWHERE = ["columns.sku", "form.sku"];

describe("Products dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(productsMessages, SAME_EVERYWHERE)).not.toThrow();
  });
});
