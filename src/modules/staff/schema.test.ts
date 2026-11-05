import { describe, expect, it } from "vitest";

import { shiftObject } from "./schema";

describe("shift schema composition", () => {
  it("lets the unrefined shift object pick a field", () => {
    expect(Object.keys(shiftObject.pick({ id: true }).shape)).toEqual(["id"]);
  });
});
