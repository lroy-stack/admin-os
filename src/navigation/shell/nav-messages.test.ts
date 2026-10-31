import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

import { navMessages } from "./nav-messages.server";

// The same word in every language of the kit.
const SAME_EVERYWHERE = ["chat", "legacy-crm"];

describe("navigation dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(navMessages, SAME_EVERYWHERE)).not.toThrow();
  });
});
