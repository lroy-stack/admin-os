import { describe, expect, it } from "vitest";

import { assertDictionaryParity, LOCALES } from "@/core/i18n";

import { monitoringMessages } from "./messages.server";
import { localizePatients } from "./patient-localize";
import { formatLimits, formatTemperature, unitSymbol } from "./vital-format";

// Symbols and joins that every language writes the same way: SpO₂, mmHg, paper speed and gain, "{min}–{max}", and
// the "{age} {sex} · {diagnosis}" line.
const sharedNotation = [
  "vitals.spo2",
  "units.pressure",
  "calibration.ecg",
  "calibration.respiration",
  "range",
  "patientLine",
];

describe("Patient monitoring dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(monitoringMessages, sharedNotation)).not.toThrow();
  });
});

describe("localizePatients", () => {
  it.each(LOCALES)("writes every patient in %s without leftover placeholders", (locale) => {
    const written = JSON.stringify(localizePatients(locale, monitoringMessages[locale]));
    expect(written).not.toMatch(/\{\w+\}/);
  });

  it.each([
    ["en", "HR HIGH 104 > 100 bpm"],
    ["es", "FC ALTA 104 > 100 lpm"],
    ["de", "HF HOCH 104 > 100 /min"],
    ["fr", "FC ÉLEVÉE 104 > 100 bpm"],
  ] as const)("words the heart-rate alarm for %s", (locale, banner) => {
    const alarmed = localizePatients(locale, monitoringMessages[locale]).find((patient) => patient.alarm);
    expect(alarmed?.alarm?.text).toBe(banner);
  });
});

describe("vital formats", () => {
  it.each([
    ["en", "36.8", "°C", "36.0–38.0"],
    ["es", "36,8", "°C", "36,0–38,0"],
    ["de", "36,8", "°C", "36,0–38,0"],
    ["fr", "36,8", "°C", "36,0–38,0"],
  ] as const)("writes temperature, unit and limits for %s", (locale, temperature, unit, limits) => {
    expect([
      formatTemperature(36.8, locale),
      unitSymbol("celsius", locale),
      formatLimits("{min}–{max}", locale, 36, 38, 1),
    ]).toEqual([temperature, unit, limits]);
  });
});
