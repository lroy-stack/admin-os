import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

import { overlaysMessages } from "./server";

describe("overlays dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(overlaysMessages)).not.toThrow();
  });
});
