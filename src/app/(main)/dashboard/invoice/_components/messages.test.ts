import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

import { invoiceMessages } from "./messages.server";

// Identical on purpose: GST is the tax's own abbreviation, and the tax line only joins two values.
const SAME_EVERYWHERE = ["taxes.gst", "paper.taxLine"];

describe("invoice dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(invoiceMessages, SAME_EVERYWHERE)).not.toThrow();
  });
});
