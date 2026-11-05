import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

import { customerRecordMessages } from "./messages.server";

// Identical on purpose: "VIP" is the same word in every language, and the byline is only a placeholder pattern.
const SAME_EVERYWHERE = ["notes.byline"];

describe("customer record dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(customerRecordMessages, SAME_EVERYWHERE)).not.toThrow();
  });
});
