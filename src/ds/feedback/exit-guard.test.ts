import { describe, expect, it, vi } from "vitest";

import { askBeforeLeaving, isSentinel } from "./exit-guard";

describe("askBeforeLeaving", () => {
  it("lets the navigation go ahead, without running anything, when nothing is dirty", () => {
    const proceed = vi.fn();

    expect(askBeforeLeaving(proceed)).toBe(false);
    expect(proceed).not.toHaveBeenCalled();
  });
});

describe("isSentinel", () => {
  it("recognises the entry the guard pushed, with the router's own keys beside it", () => {
    expect(isSentinel({ __exitGuard: true, __NA: true })).toBe(true);
  });

  it.each([null, undefined, "x", { __NA: true }])("rejects %j", (state) => {
    expect(isSentinel(state)).toBe(false);
  });
});
