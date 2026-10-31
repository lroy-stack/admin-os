import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

import { infrastructureMessages } from "./messages.server";

// Identical on purpose: technical abbreviations and a product name that every language writes the same way.
const SAME_EVERYWHERE = ["resources.cpu", "resources.ram", "projects.kanban"];

describe("infrastructure dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(infrastructureMessages, SAME_EVERYWHERE)).not.toThrow();
  });
});
