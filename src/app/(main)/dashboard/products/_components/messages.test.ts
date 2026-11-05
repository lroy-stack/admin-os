import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

import { productsMessages } from "./messages.server";

describe("Products dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(productsMessages)).not.toThrow();
  });
});
