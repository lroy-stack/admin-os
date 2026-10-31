import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

import { financeV1Messages } from "./messages.server";

// Identical on purpose: CVV is the same abbreviation everywhere and ChatGPT Plus is a product name.
const SAME_EVERYWHERE = ["card.cvv", "card.payments.chatgpt"];

describe("finance-v1 dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(financeV1Messages, SAME_EVERYWHERE)).not.toThrow();
  });
});
