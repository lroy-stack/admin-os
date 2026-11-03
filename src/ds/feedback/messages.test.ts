import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

import { feedbackMessages } from "./server";

describe("feedback dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(feedbackMessages)).not.toThrow();
  });
});
