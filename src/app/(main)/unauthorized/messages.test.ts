import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

import { unauthorizedMessages } from "./messages.server";

describe("unauthorized dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(unauthorizedMessages)).not.toThrow();
  });
});
