import { describe, expect, it } from "vitest";

import { type CallResult, err, ok, readStateOf } from "./index";

const isEmpty = (rows: readonly string[]) => rows.length === 0;
const awaiting: CallResult<readonly string[]> = { status: "awaiting_approval", approvalId: "ap_1" };

describe("readStateOf", () => {
  it("is loading while there is no result yet", () => {
    expect(readStateOf(undefined, isEmpty)).toEqual({ status: "loading" });
  });

  it("is ready for an ok result with data", () => {
    expect(readStateOf(ok(["a"]), isEmpty)).toEqual({ status: "ready" });
  });

  it("is empty only for an ok result the caller calls empty", () => {
    expect(readStateOf(ok([]), isEmpty)).toEqual({ status: "empty" });
  });

  it("is an error with its code for a failed read, never empty", () => {
    expect(readStateOf(err("bookings.unavailable", "down"), isEmpty)).toEqual({
      status: "error",
      code: "bookings.unavailable",
    });
  });

  it("is forbidden, with its code, when the error class is forbidden", () => {
    expect(readStateOf(err("access.forbidden", "no"), isEmpty)).toEqual({
      status: "forbidden",
      code: "access.forbidden",
    });
  });

  it("treats a module's own forbidden code as forbidden", () => {
    expect(readStateOf(err("bookings.forbidden", "no"), isEmpty).status).toBe("forbidden");
  });

  it("shows a read held for approval as an error without leaking the approval id", () => {
    const state = readStateOf(awaiting, isEmpty);

    expect(state).toEqual({ status: "error", code: "schema.invalid_output" });
    expect(JSON.stringify(state)).not.toContain("ap_1");
  });
});
