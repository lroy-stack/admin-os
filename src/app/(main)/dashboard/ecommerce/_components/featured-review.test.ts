import { describe, expect, it } from "vitest";

import { stepIndex } from "./featured-review";

describe("stepIndex", () => {
  it("moves to the next review", () => {
    expect(stepIndex(0, 1, 3)).toBe(1);
  });

  it("wraps from the last review to the first", () => {
    expect(stepIndex(2, 1, 3)).toBe(0);
  });

  it("wraps from the first review to the last", () => {
    expect(stepIndex(0, -1, 3)).toBe(2);
  });
});
