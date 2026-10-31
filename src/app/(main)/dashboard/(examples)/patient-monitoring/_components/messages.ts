import { type MessageKey, messageKey, type PageMeta, type Plural } from "@/core/i18n/client";

import type { DiagnosisId, PatientEventSource } from "./data";

/** Text of /dashboard/patient-monitoring: the monitor's UI and the demo patients' clinical wording. */
export interface MonitoringMessages {
  readonly meta: PageMeta;
  readonly header: {
    readonly title: string;
    /** Placeholders: `{count}`. */
    readonly patients: Plural;
    readonly audioOn: string;
    readonly networkOn: string;
    /** Placeholders: `{device}`, a device code. */
    readonly device: string;
  };
  readonly footer: {
    readonly mainScreen: string;
    readonly patientSetup: string;
    readonly alarmReview: string;
    readonly waveReview: string;
    readonly trends: string;
    readonly print: string;
    readonly silence: string;
  };
  /** Placeholders: `{bed}`, `{name}`. */
  readonly openPatient: string;
  /** The sex abbreviation shown after the age. */
  readonly sex: { readonly female: string; readonly male: string };
  /** Placeholders: `{age}`, `{sex}`, `{diagnosis}`. */
  readonly patientLine: string;
  readonly alarm: {
    /** Placeholders: `{value}`, `{limit}`, `{unit}`. */
    readonly hrHigh: string;
    /** Placeholders: `{value}`. */
    readonly hrHighBadge: string;
    /** Placeholders: `{duration}`. */
    readonly activeFor: string;
    readonly acknowledge: string;
    readonly acknowledged: string;
  };
  readonly tabs: {
    readonly realTime: string;
    readonly events: string;
    readonly trends: string;
    readonly disclosure: string;
  };
  readonly realTime: { readonly title: string; readonly description: string };
  readonly disclosure: {
    readonly title: string;
    /** Placeholders: `{hours}`. */
    readonly description: string;
  };
  readonly events: { readonly time: string; readonly event: string; readonly recent: string };
  /** One sentence per event kind; `nibp` takes `{value}`, `leadSelected` `{lead}`, `hrAbove` `{limit}`. */
  readonly eventLines: Readonly<Record<PatientEventSource["kind"], string>>;
  readonly diagnoses: Readonly<Record<DiagnosisId, string>>;
  /** Monitor labels for the measurements and traces. SpO₂ is the same in every language. */
  readonly vitals: {
    readonly hr: string;
    readonly spo2: string;
    readonly rr: string;
    readonly nibp: string;
    readonly art: string;
    readonly temp: string;
    readonly map: string;
  };
  readonly traces: {
    readonly ecgII: string;
    readonly ecgV5: string;
    readonly pleth: string;
    readonly resp: string;
    readonly art: string;
  };
  /** Units `Intl` has no unit for. The percent and temperature units come from `Intl`. */
  readonly units: { readonly heartRate: string; readonly respiration: string; readonly pressure: string };
  /** Paper speed and gain of the traces: technical notation, the same in every language. */
  readonly calibration: { readonly ecg: string; readonly respiration: string };
  /** Placeholders: `{min}`, `{max}`. */
  readonly range: string;
  readonly aria: {
    /** Placeholders: `{bed}`, `{trace}`. */
    readonly waveform: string;
    /** Placeholders: `{bed}`, `{vital}`. */
    readonly trend: string;
  };
}

export const monitoringMessageKey: MessageKey<MonitoringMessages> = messageKey<MonitoringMessages>("monitoring");
