import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

import { crmV1Messages } from "./messages.server";

// "Leads" is the same loanword in en, es and de; "tooltipRange" differs only in French typography.
describe("CRM dashboard (crm-v1) dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(crmV1Messages)).not.toThrow();
  });
});
