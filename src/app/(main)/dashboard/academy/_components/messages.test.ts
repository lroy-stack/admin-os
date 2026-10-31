import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

import { academyMessages } from "./messages.server";

// Identical on purpose: joins of values with a dash, a bullet or a dot, which no language writes differently.
const SAME_EVERYWHERE = ["timeRange", "schedule.classLine", "performance.studentLine", "performance.classLine"];

describe("academy dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(academyMessages, SAME_EVERYWHERE)).not.toThrow();
  });
});
