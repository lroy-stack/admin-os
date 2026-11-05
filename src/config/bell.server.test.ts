import { describe, expect, it } from "vitest";

import { bellRequestSchema, bellWriteOf } from "./bell.server";

describe("the bell's one request (ADR 0017 'The bell')", () => {
  it.each([
    [{ op: "load" }],
    [{ op: "read", feed: "notifications", input: { ids: ["booking.new:R-1"] } }],
    [{ op: "readAll", feed: "notifications", input: { upTo: "booking.new:R-1" } }],
    [{ op: "approve", input: { approvalId: "a-1" } }],
    [{ op: "reject", input: { approvalId: "a-1", reason: "no" } }],
  ])("accepts %j", (request) => {
    expect(bellRequestSchema.safeParse(request).success).toBe(true);
  });

  it.each([
    ["an operation it does not have", { op: "delete", feed: "notifications", input: {} }],
    ["a read without a feed", { op: "read", input: {} }],
    ["a load with a payload", { op: "load", input: {} }],
    ["an approval with a feed", { op: "approve", feed: "approvals", input: {} }],
    ["something that is not an object", "load"],
  ])("refuses %s", (_case, request) => {
    expect(bellRequestSchema.safeParse(request).success).toBe(false);
  });
});

describe("the capability a write request runs", () => {
  it("runs the kernel's approvals.approve and approvals.reject for a decision", () => {
    expect([bellWriteOf({ op: "approve", input: {} }), bellWriteOf({ op: "reject", input: {} })]).toEqual([
      "approvals.approve",
      "approvals.reject",
    ]);
  });

  it("names nothing for a feed no installed module declares", () => {
    expect(bellWriteOf({ op: "read", feed: "no-such-feed", input: {} })).toBeUndefined();
  });
});
