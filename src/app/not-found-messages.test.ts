import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

import { notFoundMessages } from "./not-found-messages.server";

describe("not-found dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(notFoundMessages)).not.toThrow();
  });
});
