import { describe, expect, it } from "vitest";

import { err, ok } from "@/core/result";

import { type Page, readAllPages } from "./read-pages";

const pages: Record<string, Page<number>> = {
  first: { items: [1, 2], nextCursor: "second" },
  second: { items: [3], nextCursor: "third" },
  third: { items: [4, 5], nextCursor: null },
};

const pageAt = (cursor: string | undefined) => pages[cursor ?? "first"] as Page<number>;

describe("readAllPages", () => {
  it("returns the items of every page in order", async () => {
    const result = await readAllPages(async (cursor) => ok(pageAt(cursor)));

    expect(result).toEqual(ok([1, 2, 3, 4, 5]));
  });

  it("asks for the first page without a cursor and then follows the cursors", async () => {
    const asked: (string | undefined)[] = [];
    await readAllPages(async (cursor) => {
      asked.push(cursor);
      return ok(pageAt(cursor));
    });

    expect(asked).toEqual([undefined, "second", "third"]);
  });

  it("returns an empty list for an empty first page", async () => {
    expect(await readAllPages(async () => ok({ items: [], nextCursor: null }))).toEqual(ok([]));
  });

  it("stops at the first failure and returns it", async () => {
    const failure = err("bookings.not_found", "gone");
    const result = await readAllPages(async (cursor) => (cursor === undefined ? ok(pageAt(cursor)) : failure));

    expect(result).toBe(failure);
  });
});
