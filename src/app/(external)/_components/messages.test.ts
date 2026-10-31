import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

import { landingMessages } from "./messages.server";

describe("landing dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(landingMessages)).not.toThrow();
  });
});
