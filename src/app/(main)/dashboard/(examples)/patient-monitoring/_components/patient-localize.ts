import { format, type Locale } from "@/core/i18n";

import type { CardiacRhythm, PatientEventSource, PatientSource } from "./data";
import { patientSources } from "./data";
import type { MonitoringMessages } from "./messages";
import { formatTemperature } from "./vital-format";

/** A patient with every sentence already written for one locale; the client component only renders it. */
export interface PatientRecord {
  age: number;
  /** `text` is the banner ("HR HIGH 104 > 100 bpm"), `badge` the card's short form, `activeFor` the duration line. */
  alarm?: { text: string; badge: string; activeFor: string };
  arterialMap: number;
  arterialPressure: string;
  bed: string;
  diagnosis: string;
  heartRate: number;
  id: string;
  map: number;
  name: string;
  nibp: string;
  recentEvents: { label: string; time: string }[];
  respirationRate: number;
  sexLabel: string;
  signalProfile: { amplitude: number; phase: number; rhythm: CardiacRhythm };
  spo2: number;
  status: "alarm" | "stable";
  temperature: string;
}

function eventLabel(event: PatientEventSource, locale: Locale, text: MonitoringMessages): string {
  const template = text.eventLines[event.kind];
  switch (event.kind) {
    case "nibp":
      return format(template, locale, { value: event.value });
    case "leadSelected":
      return format(template, locale, { lead: event.lead });
    case "hrAbove":
      return format(template, locale, { limit: event.limit });
    default:
      return template;
  }
}

function localizePatient(source: PatientSource, locale: Locale, text: MonitoringMessages): PatientRecord {
  const { alarm } = source;
  return {
    age: source.age,
    alarm: alarm && {
      text: format(text.alarm.hrHigh, locale, {
        value: source.heartRate,
        limit: alarm.limit,
        unit: text.units.heartRate,
      }),
      badge: format(text.alarm.hrHighBadge, locale, { value: source.heartRate }),
      activeFor: format(text.alarm.activeFor, locale, { duration: alarm.duration }),
    },
    arterialMap: source.arterialMap,
    arterialPressure: source.arterialPressure,
    bed: source.bed,
    diagnosis: text.diagnoses[source.diagnosis],
    heartRate: source.heartRate,
    id: source.id,
    map: source.map,
    name: source.name,
    nibp: source.nibp,
    recentEvents: source.recentEvents.map((event) => ({ label: eventLabel(event, locale, text), time: event.time })),
    respirationRate: source.respirationRate,
    sexLabel: source.sex === "F" ? text.sex.female : text.sex.male,
    signalProfile: source.signalProfile,
    spo2: source.spo2,
    status: source.status,
    temperature: formatTemperature(source.temperature, locale),
  };
}

/** The demo patients written for one locale (spec D5: clinical wording is localized, names and beds are not). */
export function localizePatients(locale: Locale, text: MonitoringMessages): PatientRecord[] {
  return patientSources.map((source) => localizePatient(source, locale, text));
}
