import { describe, expect, it } from "vitest";
import { z } from "zod";

import type { ConfirmOutcome } from "./confirm-action";
import { checkReason, failureText, reasonHint } from "./confirm-action";
import { overlaysMessages } from "./server";

const text = overlaysMessages.en.confirm;
const reason = { label: "Reason", schema: z.string().trim().min(3, "Write at least 3 characters") };

describe("failureText", () => {
  it.each<[string, ConfirmOutcome, string | undefined]>([
    ["ok", { status: "ok" }, undefined],
    ["awaiting approval", { status: "awaiting_approval" }, undefined],
    ["error", { status: "error", text: "Table is locked", code: "x" }, "Table is locked"],
    ["invalid with an issue", { status: "invalid", issues: [{ path: ["a"], message: "Bad" }] }, "Bad"],
    ["invalid without issues", { status: "invalid", issues: [] }, text.invalid],
  ])("maps %s to the text shown, if any", (_name, outcome, expected) => {
    expect(failureText(outcome, text)).toBe(expected);
  });
});

describe("checkReason", () => {
  it("accepts anything when no reason is declared", () => {
    expect(checkReason(undefined, "")).toEqual({ valid: true, value: undefined });
  });

  it("refuses an empty reason with the schema's message", () => {
    expect(checkReason(reason, "  ")).toEqual({ valid: false, message: "Write at least 3 characters" });
  });

  it("passes the parsed reason on", () => {
    expect(checkReason(reason, "  no show ")).toEqual({ valid: true, value: "no show" });
  });
});

describe("reasonHint", () => {
  const required = text.reasonRequired;
  const invalid = checkReason(reason, "");

  it("asks for a reason while the field is untouched", () => {
    expect(reasonHint(invalid, false, required)).toBe(required);
  });

  it("shows the schema's message once the field is touched", () => {
    expect(reasonHint(invalid, true, required)).toBe("Write at least 3 characters");
  });

  it("is gone once the reason is valid, so nothing is left to describe the field", () => {
    expect(reasonHint(checkReason(reason, "no show"), true, required)).toBeUndefined();
  });

  it("is absent when no reason is declared", () => {
    expect(reasonHint(checkReason(undefined, ""), false, required)).toBeUndefined();
  });
});
