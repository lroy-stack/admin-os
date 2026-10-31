import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

import { crmMessages } from "./messages.server";

describe("Deal Pipeline dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(crmMessages)).not.toThrow();
  });
});
