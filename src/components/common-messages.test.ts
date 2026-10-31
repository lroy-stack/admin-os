import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

import { commonMessages } from "./common-messages.server";

describe("common components dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(commonMessages)).not.toThrow();
  });
});
