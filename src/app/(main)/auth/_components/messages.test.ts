import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

import { authMessages } from "./messages.server";

// Identical on purpose: the masked-password placeholder is symbols only.
const SAME_EVERYWHERE = ["fields.passwordPlaceholder"];

describe("auth dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(authMessages, SAME_EVERYWHERE)).not.toThrow();
  });
});
