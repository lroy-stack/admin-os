import { describe, expect, it } from "vitest";

import { assertDictionaryParity, defaultErrorMessages, defineMessages, errorText } from "@/core/i18n";

const moduleErrors = defineMessages({
  en: { "bookings.slot_taken": "That slot is taken." },
  es: { "bookings.slot_taken": "Ese horario está ocupado." },
  de: { "bookings.slot_taken": "Dieser Termin ist belegt." },
  fr: { "bookings.slot_taken": "Ce créneau est pris." },
});

describe("errorText", () => {
  it("prefers the exact code of the module dictionary", () => {
    expect(errorText({ code: "bookings.slot_taken" }, moduleErrors, "es")).toBe("Ese horario está ocupado.");
  });

  it.each([
    ["en", "You do not have permission to do this."],
    ["fr", "Vous n’avez pas l’autorisation de faire cela."],
  ] as const)("falls back to the class text in %s", (locale, expected) => {
    expect(errorText({ code: "access.forbidden" }, moduleErrors, locale)).toBe(expected);
  });

  it("shows the code in the generic text when nothing matches", () => {
    expect(errorText({ code: "bookings.slot_taken_twice" }, moduleErrors, "de")).toBe(
      "Etwas ist schiefgelaufen. Fehlercode: bookings.slot_taken_twice.",
    );
  });

  it("never renders the server message", () => {
    const error = { code: "x.not_found", message: "SQL leaked" };
    expect(errorText(error, moduleErrors, "en")).not.toContain("SQL leaked");
  });

  it("uses a class override from the module dictionary before the default", () => {
    const dictionary = defineMessages({
      en: { not_found: "Booking gone." },
      es: { not_found: "Reserva eliminada." },
      de: { not_found: "Buchung weg." },
      fr: { not_found: "Réservation supprimée." },
    });
    expect(errorText({ code: "bookings.not_found" }, dictionary, "en")).toBe("Booking gone.");
  });
});

describe("default error dictionary", () => {
  it("passes the parity check", () => {
    expect(() => assertDictionaryParity(defaultErrorMessages)).not.toThrow();
  });
});
