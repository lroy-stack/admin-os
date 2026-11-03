import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { LocaleProvider, resolveMessages } from "@/core/i18n/client";

import type { ConfirmOutcome } from "./confirm-action";
import { ConfirmAction, checkReason, failureText } from "./confirm-action";
import { overlaysBundle, overlaysMessages } from "./server";

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

const copy = { verb: "Cancel reservation", title: "Cancel reservation?", consequence: "The table is released." };

describe("ConfirmAction", () => {
  it("renders nothing open in the server HTML", () => {
    const html = renderToStaticMarkup(
      <LocaleProvider locale="en" currency="EUR" messages={resolveMessages("en", overlaysBundle)}>
        <ConfirmAction {...copy} open onConfirm={async () => ({ status: "ok" })} />
      </LocaleProvider>,
    );

    expect(html).not.toContain("alertdialog");
  });
});
