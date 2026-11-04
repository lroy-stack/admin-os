import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

import { businessSettingsMessages } from "./messages.server";

// Identical on purpose: the GST abbreviation and the word "Website" stay as they are (docs/i18n/glossary.md).
const SAME_EVERYWHERE = ["taxes.gst", "fields.website", "fields.bank"];

describe("business settings dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(businessSettingsMessages, SAME_EVERYWHERE)).not.toThrow();
  });
});
