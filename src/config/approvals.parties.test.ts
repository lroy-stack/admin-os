import { describe, expect, it } from "vitest";

import { heldThroughMcp, itHoldsAsThePolicySays } from "./approvals.testkit";

/** What the approval mechanism does with the `parties` module's writes (ADR 0017 §7; the mechanism is in approvals.test.ts). */
describe("which parties writes wait (spec 004, D7)", () => {
  itHoldsAsThePolicySays([["destructive_and_sensitive", "parties.update", "mcp", true]]);
});

describe("what the default policy holds of parties through MCP (AC5, pinned)", () => {
  it("is exactly this write; a change to the list is a decision, not an accident", () => {
    expect(heldThroughMcp("parties")).toEqual(["parties.update"]);
  });
});
