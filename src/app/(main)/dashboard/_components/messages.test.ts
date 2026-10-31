import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

import { dashboardMessages } from "./messages.server";

// Identical on purpose: the stage and probability join is only punctuation.
const SAME_EVERYWHERE = ["deal.stageProbability"];

describe("dashboard shared dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(dashboardMessages, SAME_EVERYWHERE)).not.toThrow();
  });
});
