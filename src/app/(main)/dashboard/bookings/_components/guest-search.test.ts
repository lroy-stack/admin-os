import { describe, expect, it } from "vitest";

import { guestQuery } from "./guest-search";

describe("guestQuery", () => {
  it("waits for two characters and trims", () => {
    expect(guestQuery(" r ")).toBeNull();
    expect(guestQuery("")).toBeNull();
    expect(guestQuery(" Re ")).toBe("Re");
  });
});
