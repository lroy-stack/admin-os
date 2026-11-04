import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

import { consentMessages } from "../src/consent-messages";

describe("consent dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(consentMessages)).not.toThrow();
  });
});
