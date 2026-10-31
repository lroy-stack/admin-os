import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

import { fileManagerMessages } from "./messages.server";

// Identical on purpose: PDF is the format's own name, and "Marketing" is the same word in all four languages.
const SAME_EVERYWHERE = ["kinds.pdf", "names.folders.marketing"];

describe("File manager dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(fileManagerMessages, SAME_EVERYWHERE)).not.toThrow();
  });
});
