import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

import { staffDirectoryMessages } from "./messages.server";

describe("staff directory dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(staffDirectoryMessages)).not.toThrow();
  });
});
