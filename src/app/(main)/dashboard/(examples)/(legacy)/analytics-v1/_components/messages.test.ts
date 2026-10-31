import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

import { analyticsV1Messages } from "./messages.server";

// Joins and notation that read the same in every language: the "{current}x / {target}x" multiple and "{priority} {amount}" and "{dealId} · {stage}".
const sharedNotation = ["coverage.multiple", "queue.mixBadge", "ledger.dealStage"];

describe("Risk dashboard (analytics-v1) dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(analyticsV1Messages, sharedNotation)).not.toThrow();
  });
});
