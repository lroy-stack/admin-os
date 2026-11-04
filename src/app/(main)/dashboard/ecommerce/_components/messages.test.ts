import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

import { ecommerceMessages } from "./messages.server";

// Identical on purpose: the tooltip's date range only joins two formatted dates with a dash, and the avatar overflow is a plus sign and a number.
const SAME_EVERYWHERE = ["kpis.dateRange", "reviews.moreReviewers", "filters.showing"];

describe("Store Overview dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(ecommerceMessages, SAME_EVERYWHERE)).not.toThrow();
  });
});
