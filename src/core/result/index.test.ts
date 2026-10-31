import { describe, expect, it } from "vitest";

import { err, isAwaitingApproval, ok } from "./index";

describe("result helpers", () => {
  it("ok wraps the value", () => {
    expect(ok(3)).toEqual({ ok: true, value: 3 });
  });

  it("err builds a domain error without details when none are given", () => {
    expect(err("a.b", "msg")).toEqual({ ok: false, error: { code: "a.b", message: "msg" } });
  });

  it("err keeps details when given", () => {
    expect(err("a.b", "msg", { x: 1 })).toEqual({
      ok: false,
      error: { code: "a.b", message: "msg", details: { x: 1 } },
    });
  });

  it("isAwaitingApproval is true for the pending shape", () => {
    expect(isAwaitingApproval({ status: "awaiting_approval", approvalId: "p1" })).toBe(true);
  });

  it.each([ok(1), err("a.b", "msg")])("isAwaitingApproval is false for a Result", (result) => {
    expect(isAwaitingApproval(result)).toBe(false);
  });
});
