import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

import { kitMessages } from "./messages.server";

// Identical on purpose: names of demo places and people that all four languages write the same way.
const SAME_EVERYWHERE = ["panel.panelTitle", "quick.nameLabel", "form.nameLabel"];

describe("kit dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(kitMessages, SAME_EVERYWHERE)).not.toThrow();
  });
});
