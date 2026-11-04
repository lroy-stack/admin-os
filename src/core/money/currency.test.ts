import { describe, expect, it } from "vitest";

import { majorUnits } from "./currency";

describe("majorUnits", () => {
  it("uses two decimals for euros", () => {
    expect(majorUnits(15050, "EUR")).toBe(150.5);
  });

  it("uses none for yen", () => {
    expect(majorUnits(1500, "JPY")).toBe(1500);
  });
});
