import { describe, expect, it } from "vitest";

import { isTransportFailure, NO_ERROR_MESSAGES, toOutcome, transportFailure } from "./outcome";

describe("toOutcome", () => {
  it("maps a success and passes its value through", () => {
    expect(toOutcome({ status: "ok", value: { id: "b-1" } }, "en")).toEqual({ status: "ok", value: { id: "b-1" } });
  });

  it("maps awaiting approval without any approval id", () => {
    expect(toOutcome({ status: "awaiting_approval" }, "en")).toEqual({ status: "awaiting_approval" });
  });

  it("maps field paths to issues with the invalid-input text in the locale", () => {
    const outcome = toOutcome(
      { status: "error", code: "schema.invalid_input", paths: ["party", "guests.0.name"] },
      "es",
    );

    expect(outcome).toEqual({
      status: "invalid",
      issues: [
        { path: ["party"], message: "Algunos datos no son válidos. Revísalos e inténtalo de nuevo." },
        { path: ["guests", 0, "name"], message: "Algunos datos no son válidos. Revísalos e inténtalo de nuevo." },
      ],
    });
  });

  it("maps an invalid output to a plain error: its paths are the output's, not a field of the form", () => {
    const outcome = toOutcome({ status: "error", code: "schema.invalid_output", paths: ["booking.id"] }, "en");

    expect(outcome).toMatchObject({ status: "error", code: "schema.invalid_output" });
  });

  it("maps any other error that carries paths to a plain error", () => {
    const outcome = toOutcome({ status: "error", code: "bookings.party_invalid", paths: ["party"] }, "en");

    expect(outcome).toMatchObject({ status: "error", code: "bookings.party_invalid" });
  });

  it("maps a rejected input without paths to an error with the invalid text", () => {
    const outcome = toOutcome({ status: "error", code: "schema.invalid_input" }, "en");

    expect(outcome).toEqual({
      status: "error",
      code: "schema.invalid_input",
      text: "Some of the data is not valid. Check it and try again.",
    });
  });

  it("maps an error to the module's text for its exact code", () => {
    const dictionary = {
      ...NO_ERROR_MESSAGES,
      fr: { "bookings.table_taken": "Cette table est déjà prise." },
    };

    const outcome = toOutcome({ status: "error", code: "bookings.table_taken" }, "fr", dictionary);

    expect(outcome).toEqual({ status: "error", code: "bookings.table_taken", text: "Cette table est déjà prise." });
  });

  it("maps an unknown error to the generic text with its code", () => {
    const outcome = toOutcome({ status: "error", code: "bookings.weird" }, "de");

    expect(outcome).toEqual({
      status: "error",
      code: "bookings.weird",
      text: "Etwas ist schiefgelaufen. Fehlercode: bookings.weird.",
    });
  });
});

describe("isTransportFailure", () => {
  it.each([
    [{ status: "error", code: "transport.timeout" }, true],
    [transportFailure, true],
    [{ status: "error", code: "bookings.table_taken" }, false],
    [{ status: "ok", value: null }, false],
    [{ status: "awaiting_approval" }, false],
  ] as const)("%j is %s", (result, expected) => {
    expect(isTransportFailure(result)).toBe(expected);
  });
});
