import { describe, expect, it } from "vitest";

import { changesBetween } from "./changes";

describe("changesBetween", () => {
  it.each([
    ["equal states", { a: 1, b: [1, { c: 2 }] }, { b: [1, { c: 2 }], a: 1 }, []],
    ["a changed value", { a: 1 }, { a: 2 }, ["a: 1 -> 2"]],
    ["a nested change by index", { list: [{ x: 1 }, { x: 2 }] }, { list: [{ x: 1 }, { x: 3 }] }, ["list.1.x: 2 -> 3"]],
    ["a removed key", { a: 1, b: 2 }, { a: 1 }, ["b: 2 -> absent"]],
    ["an added subtree, leaf by leaf", { a: 1 }, { a: 1, b: { c: 1 } }, ["b.c: absent -> 1"]],
    ["a removed subtree, leaf by leaf", { a: 1, b: { c: 1 } }, { a: 1 }, ["b.c: 1 -> absent"]],
    ["an added empty subtree", { a: 1 }, { a: 1, b: {} }, ["b: absent -> {}"]],
    ["an array that grew", { l: [1] }, { l: [1, 2] }, ["l.1: absent -> 2"]],
    // The same write reads the same whether its parent was created by it or was there already.
    ["a key added to a new parent", {}, { s: { k: 1 } }, ["s.k: absent -> 1"]],
    ["a key added to a parent that exists", { s: { j: 2 } }, { s: { j: 2, k: 1 } }, ["s.k: absent -> 1"]],
  ] as const)("reports %s", (_label, before, after, expected) => {
    expect(changesBetween(before, after)).toEqual(expected);
  });
});
