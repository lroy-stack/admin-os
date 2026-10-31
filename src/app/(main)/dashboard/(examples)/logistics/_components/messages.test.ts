import { describe, expect, it } from "vitest";

import { assertDictionaryParity, LOCALES } from "@/core/i18n";

import { logisticsMessages } from "./messages.server";
import { localizeShipments } from "./shipment-localize";

// "ETA" is an abbreviation every language reads the same; "modeRoute" only joins two values with a dot and "shipmentId" is a hash sign and a code.
const sharedWords = ["list.eta", "details.modeRoute", "shipmentId"];

describe("Logistics dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(logisticsMessages, sharedWords)).not.toThrow();
  });
});

describe("localizeShipments", () => {
  it.each(LOCALES)("writes every shipment in %s without leftover placeholders", (locale) => {
    const written = JSON.stringify(localizeShipments(locale, logisticsMessages[locale]));
    expect(written).not.toMatch(/\{\w+\}/);
  });

  it.each([
    ["en", "2,450 kg", "8:45 AM"],
    ["es", "2450 kg", "8:45"],
    ["de", "2.450 kg", "8:45"],
    ["fr", "2\u202f450\u202fkg", "8:45"],
  ] as const)("formats weight and ETA time for %s", (locale, weight, time) => {
    const [first] = localizeShipments(locale, logisticsMessages[locale]);
    expect([first?.weight, first?.eta]).toEqual([weight, time]);
  });

  it.each([
    ["en", "Airport", "Indonesia"],
    ["es", "Aeropuerto", "Indonesia"],
    ["de", "Flughafen", "Indonesien"],
    ["fr", "Aéroport", "Indonésie"],
  ] as const)("names the first origin and its country for %s", (locale, kind, country) => {
    const [first] = localizeShipments(locale, logisticsMessages[locale]);
    expect([first?.origin.display, first?.origin.country]).toEqual([expect.stringContaining(kind), country]);
  });
});
