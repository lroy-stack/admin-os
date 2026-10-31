import { describe, expect, it } from "vitest";

import { assertDictionaryParity } from "@/core/i18n";

import { rolesMessages } from "./messages.server";

// Identical on purpose: loanwords and product terms that all four languages write the same way.
const SAME_EVERYWHERE = ["permissionSets.webhooks", "permissionSets.tickets", "roleNames.marketing"];

describe("roles dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(rolesMessages, SAME_EVERYWHERE)).not.toThrow();
  });
});
