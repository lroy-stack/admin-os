import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

import { customerDirectoryMessages } from "./messages.server";

// Identical on purpose: "VIP" is the same word in every language.
const SAME_EVERYWHERE = ["status.vip", "card.vip", "csv.vip"];

describe("customer directory dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(customerDirectoryMessages, SAME_EVERYWHERE)).not.toThrow();
  });
});
