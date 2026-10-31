import { describe, expect, it } from "vitest";
import { z } from "zod";

import type { Result } from "@/core/result";

import { MAX_CURSOR_LENGTH, MAX_PAGE_LIMIT, pageInput, pageOutput, paginate } from "./index";

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

/** Test helpers stay outside the test bodies (house rule: no conditionals inside a test). */
const unwrap = <T>(result: Result<T>): T => {
  if (!result.ok) throw new Error(`expected ok, got ${result.error.code}`);
  return result.value;
};

const nextOf = (page: { nextCursor: string | null }): string => {
  if (page.nextCursor === null) throw new Error("expected a next cursor");
  return page.nextCursor;
};

describe("paginate", () => {
  const items = ["a", "b", "c", "d", "e"];

  it("returns the first page and a cursor to the next", () => {
    expect(paginate(items, { limit: 2 })).toEqual({
      ok: true,
      value: { items: ["a", "b"], nextCursor: expect.any(String) },
    });
  });

  it("walks every page with the returned cursors and ends with a null cursor", () => {
    const first = unwrap(paginate(items, { limit: 2 }));
    const second = unwrap(paginate(items, { cursor: nextOf(first), limit: 2 }));
    const third = unwrap(paginate(items, { cursor: nextOf(second), limit: 2 }));
    expect([first.items, second.items, third.items]).toEqual([["a", "b"], ["c", "d"], ["e"]]);
    expect(third.nextCursor).toBeNull();
  });

  it.each(["not-base64-json", Buffer.from(JSON.stringify({ o: -1 })).toString("base64url")])(
    "rejects the cursor %s as invalid input",
    (cursor) => {
      expect(paginate(items, { cursor, limit: 2 })).toMatchObject({
        ok: false,
        error: { code: "schema.invalid_input" },
      });
    },
  );

  it("keeps the cursor within the contract's length", () => {
    const page = unwrap(
      paginate(
        Array.from({ length: 10_000 }, (_, index) => index),
        { limit: 1 },
      ),
    );
    expect(nextOf(page).length).toBeLessThanOrEqual(MAX_CURSOR_LENGTH);
  });
});
