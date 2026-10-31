import { describe, expect, it } from "vitest";

import { can } from "./can";

const access = { permissions: ["read:bookings", "manage:settings"] };

describe("can", () => {
  it.each([
    ["read:bookings", true],
    ["manage:settings", true],
    ["read:customers", false],
    ["read:booking", false],
    ["unknown:thing", false],
  ] as const)("answers %s with %s", (permission, expected) => {
    expect(can(access, permission)).toBe(expected);
  });

  it("denies everything to an actor without permissions", () => {
    expect(can({ permissions: [] }, "read:bookings")).toBe(false);
  });
});
