import { describe, expect, it } from "vitest";

import { ErrorCodes, errorClassOf, violationsDetailsSchema } from "./index";

describe("errorClassOf", () => {
  it.each([
    [ErrorCodes.forbidden, "forbidden"],
    [ErrorCodes.invalidInput, "invalid"],
    [ErrorCodes.invalidOutput, "invalid_output"],
    [ErrorCodes.timeout, "timeout"],
    [ErrorCodes.unavailable, "unavailable"],
    [ErrorCodes.idempotencyRequired, "invalid"],
    [ErrorCodes.idempotencyConflict, "conflict"],
    ["customers.not_found", "not_found"],
    ["customers.required", "invalid"],
    ["customers.invalid", "invalid"],
    ["bookings.conflict", "conflict"],
    ["transport.reset", "unavailable"],
    ["bookings.something_else", "unknown"],
    ["nodot", "unknown"],
  ])("maps %s to %s", (code, expected) => {
    expect(errorClassOf(code)).toBe(expected);
  });
});

describe("violationsDetailsSchema", () => {
  it("accepts violations with rule id, severity and params", () => {
    const details = { violations: [{ ruleId: "r1", severity: "error", params: { max: 4 } }] };
    expect(violationsDetailsSchema.parse(details)).toEqual(details);
  });

  it("rejects a violation without a rule id", () => {
    expect(violationsDetailsSchema.safeParse({ violations: [{ severity: "error", params: {} }] }).success).toBe(false);
  });
});
