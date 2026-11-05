import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

import { partyDirectoryMessages } from "./messages.server";

// Terms that are the same word in every language (none yet).
const SAME_EVERYWHERE: string[] = [];

describe("party directory dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(partyDirectoryMessages, SAME_EVERYWHERE)).not.toThrow();
  });
});
