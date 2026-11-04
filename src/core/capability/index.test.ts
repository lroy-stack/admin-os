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
  const setState = { change: "set", idempotency: "target-state" } as const;
  const keyedSet = {
    effect: "write",
    riskTier: 2,
    change: "set",
    idempotency: "key",
    requiresIdempotencyKey: true,
  } as const;

  it.each([
    ["read-tier", { effect: "read", riskTier: 2 }],
    ["tier3-destructive", { effect: "write", riskTier: 3, ...setState }],
    ["destructive-tier", { effect: "destructive", riskTier: 1, ...setState }],
    ["key-on-read", { effect: "read", riskTier: 0, requiresIdempotencyKey: true }],
    ["write-change", { effect: "write", riskTier: 2, idempotency: "target-state" }],
    ["write-change", { effect: "read", riskTier: 0, change: "set" }],
    ["write-idempotency", { effect: "write", riskTier: 2, change: "set" }],
    ["write-idempotency", { effect: "read", riskTier: 0, idempotency: "target-state" }],
    ["idempotency-key", { effect: "write", riskTier: 2, change: "set", idempotency: "key" }],
    ["idempotency-key", { ...keyedSet, idempotency: "target-state" }],
    ["add-key", { effect: "write", riskTier: 2, change: "add", idempotency: "target-state" }],
  ] as const)("reports %s", (rule, fixture) => {
    expect(descriptorViolations(fixture)).toEqual([rule]);
  });

  it.each([
    ["a non-personal read", { effect: "read", riskTier: 0 }],
    ["a personal read", { effect: "read", riskTier: 1 }],
    ["a business write", { effect: "write", riskTier: 2, change: "overwrite", idempotency: "target-state" }],
    [
      "a keyed create",
      { effect: "write", riskTier: 2, change: "add", idempotency: "key", requiresIdempotencyKey: true },
    ],
    ["a keyed set-state write", keyedSet],
    [
      "an irreversible destructive write",
      { effect: "destructive", riskTier: 3, change: "remove", idempotency: "target-state" },
    ],
  ] as const)("accepts %s", (_label, fixture) => {
    expect(descriptorViolations(fixture)).toEqual([]);
  });
});
