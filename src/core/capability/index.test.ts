import { describe, expect, it } from "vitest";
import { z } from "zod";

import { defineCapability, descriptorViolations, mergeCatalogs } from "./index";

const capability = (id: string) =>
  defineCapability({
    id,
    summary: "Test capability",
    input: z.object({}),
    output: z.object({}),
    permission: "read:test",
    effect: "read",
    riskTier: 0,
  });

describe("mergeCatalogs", () => {
  it("merges catalogs with distinct ids", () => {
    const a = capability("a.b.get");
    const b = capability("c.d.get");
    expect(mergeCatalogs({ [a.id]: a }, { [b.id]: b })).toEqual({ "a.b.get": a, "c.d.get": b });
  });

  it("throws on a duplicate id and names it", () => {
    const a = capability("a.b.get");
    expect(() => mergeCatalogs({ [a.id]: a }, { [a.id]: a })).toThrow('Duplicate capability id "a.b.get"');
  });
});

describe("defineCapability", () => {
  it("returns the same object", () => {
    const definition = {
      id: "a.b.get",
      summary: "x",
      input: z.object({}),
      output: z.object({}),
      permission: "read:a",
      effect: "read",
      riskTier: 0,
    } as const;
    expect(defineCapability(definition)).toBe(definition);
  });
});

describe("descriptorViolations", () => {
  const approve = () => true;

  it.each([
    ["read-tier", { effect: "read", riskTier: 2 }],
    ["read-approval", { effect: "read", riskTier: 1, approval: approve, mayRequireApproval: true }],
    ["tier3-destructive", { effect: "write", riskTier: 3 }],
    ["destructive-tier", { effect: "destructive", riskTier: 1 }],
    ["approval-flag", { effect: "write", riskTier: 2, approval: approve }],
    ["key-on-read", { effect: "read", riskTier: 0, requiresIdempotencyKey: true }],
  ] as const)("reports %s", (rule, fixture) => {
    expect(descriptorViolations(fixture)).toEqual([rule]);
  });

  it.each([
    ["a non-personal read", { effect: "read", riskTier: 0 }],
    ["a personal read", { effect: "read", riskTier: 1 }],
    ["a business write", { effect: "write", riskTier: 2 }],
    ["a keyed write", { effect: "write", riskTier: 2, requiresIdempotencyKey: true }],
    ["a write that may need approval", { effect: "write", riskTier: 2, approval: approve, mayRequireApproval: true }],
    ["an irreversible destructive write", { effect: "destructive", riskTier: 3 }],
  ] as const)("accepts %s", (_label, fixture) => {
    expect(descriptorViolations(fixture)).toEqual([]);
  });
});
