import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

import { financeMessages } from "./messages.server";

// Identical on purpose: income shares and upcoming dates only join values with a dot, and "Resend Pro Team" is a
// product plan name.
const SAME_EVERYWHERE = ["income.share", "upcoming.when", "upcoming.items.resend", "wallet.quantity"];

describe("finance dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(financeMessages, SAME_EVERYWHERE)).not.toThrow();
  });
});
