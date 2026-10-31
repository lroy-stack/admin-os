import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

import { overviewMessages } from "./messages.server";

describe("Sales Overview dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(overviewMessages)).not.toThrow();
  });
});
