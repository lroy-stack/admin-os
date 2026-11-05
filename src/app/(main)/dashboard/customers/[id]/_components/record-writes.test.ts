import { describe, expect, it } from "vitest";

import {
  abilitiesOf,
  excludingSelf,
  planUnblockToast,
  restorableReason,
  toBlockInput,
  toNoteInput,
} from "./record-writes";

const CUSTOMER_ID = "C-ortega";

describe("abilitiesOf", () => {
  it.each([
    { permissions: ["update:customers", "block:customers"], edit: true, block: true },
    { permissions: ["update:customers"], edit: true, block: false },
    { permissions: ["block:customers"], edit: false, block: true },
    { permissions: ["read:customers"], edit: false, block: false },
  ])("gives edit $edit and block $block for $permissions", ({ permissions, ...expected }) => {
    expect(abilitiesOf(permissions)).toEqual(expected);
  });
});

describe("the note and block inputs", () => {
  it("maps the values to the capabilities' inputs", () => {
    expect(toNoteInput(CUSTOMER_ID, { text: "Hello" })).toEqual({ id: CUSTOMER_ID, text: "Hello" });
    expect(toBlockInput(CUSTOMER_ID, "No show")).toEqual({ id: CUSTOMER_ID, reason: "No show" });
  });
});

describe("restorableReason", () => {
  it.each([
    { reason: "Called three times", expected: "Called three times" },
    { reason: "  padded  ", expected: "padded" },
    { reason: "   ", expected: null },
    { reason: "", expected: null },
    { reason: undefined, expected: null },
  ])("is $expected for $reason", ({ reason, expected }) => {
    expect(restorableReason(reason)).toBe(expected);
  });
});

describe("excludingSelf", () => {
  it("drops the customer being edited and keeps the others", () => {
    const matches = [{ id: CUSTOMER_ID }, { id: "C-bravo" }];
    expect(excludingSelf(matches, CUSTOMER_ID)).toEqual([{ id: "C-bravo" }]);
  });

  it("is empty when the only match is the customer themselves", () => {
    expect(excludingSelf([{ id: CUSTOMER_ID }], CUSTOMER_ID)).toEqual([]);
  });
});

describe("planUnblockToast", () => {
  const REASON = "Called three times";
  const ok = { status: "ok", value: null } as const;

  it.each([
    { name: "a refused second submit", outcome: null, reason: REASON, expected: { kind: "none" } },
    { name: "an unblock with a reason", outcome: ok, reason: REASON, expected: { kind: "undo", reason: REASON } },
    { name: "an unblock with no reason", outcome: ok, reason: null, expected: { kind: "final" } },
    {
      name: "a refused write",
      outcome: { status: "error", text: "Nope", code: "x" } as const,
      reason: REASON,
      expected: { kind: "error" },
    },
    {
      name: "invalid input",
      outcome: { status: "invalid", issues: [] } as const,
      reason: REASON,
      expected: { kind: "error" },
    },
    {
      name: "a write held for approval, which the web path never is",
      outcome: { status: "awaiting_approval" } as const,
      reason: REASON,
      expected: { kind: "error" },
    },
  ])("plans $expected.kind for $name", ({ outcome, reason, expected }) => {
    expect(planUnblockToast(outcome, reason)).toEqual(expected);
  });
});
