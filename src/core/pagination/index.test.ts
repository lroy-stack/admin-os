import { describe, expect, it } from "vitest";
import { z } from "zod";

import { MAX_PAGE_LIMIT, pageInput, pageOutput } from "./index";

const input = pageInput({ defaultLimit: 20, maxLimit: 50 });

describe("pageInput", () => {
  it("applies the default limit", () => {
    expect(input.parse({})).toEqual({ limit: 20 });
  });

  it("keeps cursor and limit", () => {
    expect(input.parse({ cursor: "abc", limit: 10 })).toEqual({ cursor: "abc", limit: 10 });
  });

  it.each([{ limit: 51 }, { limit: 0 }, { limit: 1.5 }, { offset: 10 }, { cursor: "" }, { cursor: "x".repeat(513) }])(
    "rejects %o",
    (value) => {
      expect(input.safeParse(value).success).toBe(false);
    },
  );

  it.each([
    { defaultLimit: 20, maxLimit: MAX_PAGE_LIMIT + 1 },
    { defaultLimit: 60, maxLimit: 50 },
    { defaultLimit: 0, maxLimit: 50 },
  ])("throws for options %o", (options) => {
    expect(() => pageInput(options)).toThrow(RangeError);
  });
});

describe("pageOutput", () => {
  const output = pageOutput(z.object({ id: z.string() }));

  it.each([
    { items: [{ id: "a" }], nextCursor: null },
    { items: [], nextCursor: "next" },
  ])("accepts %o", (value) => {
    expect(output.parse(value)).toEqual(value);
  });

  it.each([{ items: [{ id: 1 }], nextCursor: null }, { items: [] }])("rejects %o", (value) => {
    expect(output.safeParse(value).success).toBe(false);
  });
});
