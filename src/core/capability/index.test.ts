import { describe, expect, it } from "vitest";
import { z } from "zod";

import { defineCapability, mergeCatalogs } from "./index";

const capability = (id: string) =>
  defineCapability({
    id,
    summary: "Test capability",
    input: z.object({}),
    output: z.object({}),
    permission: "read:test",
    effect: "read",
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
    } as const;
    expect(defineCapability(definition)).toBe(definition);
  });
});
