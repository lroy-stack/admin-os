/**
 * Demo patients as data: ids, enums and numbers only. Diagnoses, alarm and event wording live in the route
 * dictionary and are written for one locale by `localizePatients`. Names and bed codes are proper nouns.
 */
type PatientStatus = "alarm" | "stable";

export type CardiacRhythm =
  | "atrial-fibrillation"
  | "low-voltage"
  | "occasional-pvc"
  | "paced"
  | "sinus"
  | "sinus-bradycardia"
  | "sinus-tachycardia"
  | "st-depression";

export type DiagnosisId =
  | "postCabg"
  | "atrialFibrillation"
  | "unstableAngina"
  | "postPci"
  | "postAblation"
  | "acuteCoronarySyndrome"
  | "heartFailure"
  | "postAngiography"
  | "postPacemakerInsertion"
  | "nstemiObservation";

interface SignalProfile {
  amplitude: number;
  phase: number;
  rhythm: CardiacRhythm;
}

/** What happened; the sentence comes from the dictionary. `time` is a clock reading such as "01:24". */
export type PatientEventSource =
  | { kind: "nibp"; value: string; time: string }
  | { kind: "leadSelected"; lead: string; time: string }
  | { kind: "hrAbove"; limit: number; time: string }
  | {
      kind:
        | "rhythmStripSaved"
        | "ecg12Complete"
        | "spo2ProbeChecked"
        | "pacingOff"
        | "stReviewComplete"
        | "fluidBalanceUpdated"
        | "accessSiteChecked"
        | "pacingCaptureVerified"
        | "cardiacEnzymesReviewed";
      time: string;
    };

interface PatientAlarmSource {
  kind: "hrHigh";
  /** The alarm limit in beats per minute; the reading is the patient's heart rate. */
  limit: number;
  /** How long the alarm has been active, as minutes:seconds. */
  duration: string;
}

export interface PatientSource {
  age: number;
  alarm?: PatientAlarmSource;
  arterialMap: number;
  arterialPressure: string;
  bed: string;
  diagnosis: DiagnosisId;
  heartRate: number;
  id: string;
  map: number;
  name: string;
  nibp: string;
  recentEvents: PatientEventSource[];
  respirationRate: number;
  sex: "F" | "M";
  signalProfile: SignalProfile;
  spo2: number;
  status: PatientStatus;
  /** Degrees Celsius. */
  temperature: number;
}

/** The monitor's fixed trend scale: five hourly marks, as hours of the day. */
export const trendHours = [21, 22, 23, 0, 1] as const;

export const patientSources = [
  {
    age: 53,
    arterialMap: 92,
    arterialPressure: "124/76",
    bed: "C01",
    diagnosis: "postCabg",
    heartRate: 72,
    id: "cardiac-01",
    map: 91,
    name: "Ethan Brooks",
    nibp: "122/76",
    recentEvents: [
      { kind: "nibp", value: "122/76", time: "01:24" },
      { kind: "leadSelected", lead: "II", time: "00:51" },
    ],
    respirationRate: 16,
    sex: "M",
    signalProfile: {
      amplitude: 0.96,
      phase: 0.08,
      rhythm: "sinus",
    },
    spo2: 98,
    status: "stable",
    temperature: 36.8,
  },
  {
    age: 48,
    arterialMap: 87,
    arterialPressure: "116/72",
    bed: "C02",
    diagnosis: "atrialFibrillation",
    heartRate: 68,
    id: "cardiac-02",
    map: 86,
    name: "Olivia Rhye",
    nibp: "118/70",
    recentEvents: [
      { kind: "rhythmStripSaved", time: "01:09" },
      { kind: "nibp", value: "118/70", time: "00:43" },
    ],
    respirationRate: 17,
    sex: "F",
    signalProfile: {
      amplitude: 0.86,
      phase: 0.31,
      rhythm: "atrial-fibrillation",
    },
    spo2: 96,
    status: "stable",
    temperature: 37.0,
  },
  {
    age: 70,
    arterialMap: 96,
    arterialPressure: "132/78",
    bed: "C03",
    diagnosis: "unstableAngina",
    heartRate: 76,
    id: "cardiac-03",
    map: 94,
    name: "Nico Arendt",
    nibp: "128/77",
    recentEvents: [
      { kind: "ecg12Complete", time: "01:15" },
      { kind: "nibp", value: "128/77", time: "00:47" },
    ],
    respirationRate: 18,
    sex: "M",
    signalProfile: {
      amplitude: 1.02,
      phase: 0.54,
      rhythm: "st-depression",
    },
    spo2: 97,
    status: "stable",
    temperature: 36.9,
  },
  {
    age: 61,
    alarm: { kind: "hrHigh", limit: 100, duration: "06:12" },
    arterialMap: 88,
    arterialPressure: "121/70",
    bed: "C04",
    diagnosis: "postPci",
    heartRate: 104,
    id: "cardiac-04",
    map: 89,
    name: "Koray Okumus",
    nibp: "118/74",
    recentEvents: [
      { kind: "hrAbove", limit: 100, time: "01:26" },
      { kind: "nibp", value: "118/74", time: "01:18" },
      { kind: "spo2ProbeChecked", time: "00:48" },
    ],
    respirationRate: 20,
    sex: "M",
    signalProfile: {
      amplitude: 0.94,
      phase: 0.78,
      rhythm: "sinus-tachycardia",
    },
    spo2: 94,
    status: "alarm",
    temperature: 37.1,
  },
  {
    age: 45,
    arterialMap: 84,
    arterialPressure: "112/69",
    bed: "C05",
    diagnosis: "postAblation",
    heartRate: 64,
    id: "cardiac-05",
    map: 83,
    name: "Candice Wu",
    nibp: "110/70",
    recentEvents: [
      { kind: "nibp", value: "110/70", time: "01:02" },
      { kind: "pacingOff", time: "00:36" },
    ],
    respirationRate: 15,
    sex: "F",
    signalProfile: {
      amplitude: 0.9,
      phase: 0.17,
      rhythm: "sinus-bradycardia",
    },
    spo2: 96,
    status: "stable",
    temperature: 36.7,
  },
  {
    age: 66,
    arterialMap: 91,
    arterialPressure: "126/73",
    bed: "C06",
    diagnosis: "acuteCoronarySyndrome",
    heartRate: 80,
    id: "cardiac-06",
    map: 90,
    name: "Noah Pierre",
    nibp: "124/72",
    recentEvents: [
      { kind: "stReviewComplete", time: "01:11" },
      { kind: "nibp", value: "124/72", time: "00:40" },
    ],
    respirationRate: 19,
    sex: "M",
    signalProfile: {
      amplitude: 1.06,
      phase: 0.4,
      rhythm: "occasional-pvc",
    },
    spo2: 95,
    status: "stable",
    temperature: 37.2,
  },
  {
    age: 57,
    arterialMap: 86,
    arterialPressure: "118/68",
    bed: "C07",
    diagnosis: "heartFailure",
    heartRate: 71,
    id: "cardiac-07",
    map: 85,
    name: "Lana Steiner",
    nibp: "116/68",
    recentEvents: [
      { kind: "nibp", value: "116/68", time: "01:21" },
      { kind: "fluidBalanceUpdated", time: "00:57" },
    ],
    respirationRate: 17,
    sex: "F",
    signalProfile: {
      amplitude: 0.68,
      phase: 0.64,
      rhythm: "low-voltage",
    },
    spo2: 98,
    status: "stable",
    temperature: 36.8,
  },
  {
    age: 52,
    arterialMap: 90,
    arterialPressure: "123/71",
    bed: "C08",
    diagnosis: "postAngiography",
    heartRate: 88,
    id: "cardiac-08",
    map: 88,
    name: "Steven Tey",
    nibp: "120/72",
    recentEvents: [
      { kind: "accessSiteChecked", time: "01:16" },
      { kind: "nibp", value: "120/72", time: "00:49" },
    ],
    respirationRate: 18,
    sex: "M",
    signalProfile: {
      amplitude: 1.08,
      phase: 0.89,
      rhythm: "sinus",
    },
    spo2: 97,
    status: "stable",
    temperature: 37.0,
  },
  {
    age: 59,
    arterialMap: 89,
    arterialPressure: "120/72",
    bed: "C09",
    diagnosis: "postPacemakerInsertion",
    heartRate: 74,
    id: "cardiac-09",
    map: 88,
    name: "Mia Romberg",
    nibp: "119/71",
    recentEvents: [
      { kind: "pacingCaptureVerified", time: "01:19" },
      { kind: "nibp", value: "119/71", time: "00:45" },
    ],
    respirationRate: 16,
    sex: "F",
    signalProfile: {
      amplitude: 0.92,
      phase: 0.25,
      rhythm: "paced",
    },
    spo2: 97,
    status: "stable",
    temperature: 36.9,
  },
  {
    age: 63,
    arterialMap: 93,
    arterialPressure: "128/75",
    bed: "C10",
    diagnosis: "nstemiObservation",
    heartRate: 82,
    id: "cardiac-10",
    map: 92,
    name: "Alec Whitten",
    nibp: "126/74",
    recentEvents: [
      { kind: "cardiacEnzymesReviewed", time: "01:13" },
      { kind: "nibp", value: "126/74", time: "00:41" },
    ],
    respirationRate: 18,
    sex: "M",
    signalProfile: {
      amplitude: 0.98,
      phase: 0.71,
      rhythm: "st-depression",
    },
    spo2: 96,
    status: "stable",
    temperature: 37.1,
  },
] satisfies PatientSource[];
