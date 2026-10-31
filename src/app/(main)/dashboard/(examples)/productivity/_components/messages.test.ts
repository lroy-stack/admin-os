import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

import { productivityMessages } from "./messages.server";

describe("Productivity dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(productivityMessages)).not.toThrow();
  });
});
