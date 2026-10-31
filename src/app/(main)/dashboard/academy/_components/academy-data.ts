import type { ClockSeed } from "@/core/clock";

/** The demo school's zone, the same as the presets' business clocks, so "today" is the school's day. */
export const SCHOOL_CLOCK: ClockSeed = {
  businessDay: "2026-10-31",
  nowMin: 0,
  cutoffMin: 0,
  timeZone: "Europe/Madrid",
};

export type SubjectId = "pureMath" | "englishLiterature" | "physics" | "modernHistory" | "computerScience";

export type RoomId = "room214" | "seminar3" | "physicsLab" | "room108" | "computingLab";

export type ClassStatus = "inProgress" | "upcoming" | "cancelled";

export type ScheduledClass = {
  /** Minutes from midnight. */
  startMin: number;
  endMin: number;
  subject: SubjectId;
  /** Section of Grade 11, for example "A". */
  section: string;
  room: RoomId;
  status: ClassStatus;
};

export const classesToday: readonly ScheduledClass[] = [
  { startMin: 8 * 60, endMin: 8 * 60 + 45, subject: "pureMath", section: "A", room: "room214", status: "inProgress" },
  {
    startMin: 9 * 60,
    endMin: 9 * 60 + 45,
    subject: "englishLiterature",
    section: "B",
    room: "seminar3",
    status: "upcoming",
  },
  { startMin: 10 * 60, endMin: 10 * 60 + 45, subject: "physics", section: "C", room: "physicsLab", status: "upcoming" },
  {
    startMin: 11 * 60,
    endMin: 11 * 60 + 45,
    subject: "modernHistory",
    section: "A",
    room: "room108",
    status: "cancelled",
  },
  {
    startMin: 12 * 60,
    endMin: 12 * 60 + 45,
    subject: "computerScience",
    section: "B",
    room: "computingLab",
    status: "upcoming",
  },
];

export type AssignmentCount = { section: string; submitted: number; pending: number; overdue: number };

export const assignmentCounts: readonly AssignmentCount[] = [
  { section: "A", submitted: 14, pending: 18, overdue: 2 },
  { section: "B", submitted: 22, pending: 7, overdue: 3 },
  { section: "C", submitted: 10, pending: 19, overdue: 5 },
  { section: "D", submitted: 17, pending: 15, overdue: 6 },
  { section: "E", submitted: 24, pending: 4, overdue: 2 },
];

export type AchievementId =
  | "topPerformer"
  | "problemSolving"
  | "mostImproved"
  | "criticalAnalysis"
  | "laboratory"
  | "research"
  | "consistent";

export type HighlightSubject = "pureMath" | "literature" | "physics" | "history";

export type Highlight = {
  section: string;
  start: number;
  duration: number;
  subject: HighlightSubject;
  score: number;
  /** Students are proper nouns; only their achievement is text. */
  students: readonly { initials: string; name: string; achievement: AchievementId; score: number }[];
};

export const performanceHighlights: readonly Highlight[] = [
  {
    section: "A",
    start: 1.25,
    duration: 1.45,
    subject: "pureMath",
    score: 84,
    students: [
      { initials: "OD", name: "Olivia Davis", achievement: "topPerformer", score: 96 },
      { initials: "EM", name: "Ethan Miller", achievement: "problemSolving", score: 91 },
      { initials: "SW", name: "Sophia Wilson", achievement: "mostImproved", score: 88 },
    ],
  },
  {
    section: "B",
    start: 0.72,
    duration: 1.75,
    subject: "literature",
    score: 78,
    students: [{ initials: "IA", name: "Isabella Anderson", achievement: "criticalAnalysis", score: 93 }],
  },
  {
    section: "C",
    start: 1.35,
    duration: 1.9,
    subject: "physics",
    score: 80,
    students: [
      { initials: "AB", name: "Alexander Brown", achievement: "topPerformer", score: 95 },
      { initials: "MG", name: "Mia Garcia", achievement: "laboratory", score: 92 },
      { initials: "NM", name: "Noah Martinez", achievement: "mostImproved", score: 87 },
    ],
  },
  {
    section: "D",
    start: 2.22,
    duration: 1.66,
    subject: "history",
    score: 73,
    students: [
      { initials: "ET", name: "Emma Taylor", achievement: "research", score: 90 },
      { initials: "WJ", name: "William Johnson", achievement: "consistent", score: 86 },
    ],
  },
];

export type EventType = "onCampus" | "meeting" | "sports" | "exam";

export type EventId = "scienceExhibition" | "parentsEvening" | "sportsDay" | "mockExam" | "departmentPlanning";

export type SchoolEvent = {
  id: EventId;
  dayOffset: number;
  startMin: number;
  endMin: number;
  type: EventType;
};

export const upcomingEvents: readonly SchoolEvent[] = [
  { id: "scienceExhibition", dayOffset: 6, startMin: 8 * 60 + 30, endMin: 12 * 60 + 30, type: "onCampus" },
  { id: "parentsEvening", dayOffset: 9, startMin: 14 * 60, endMin: 17 * 60, type: "meeting" },
  { id: "sportsDay", dayOffset: 12, startMin: 9 * 60, endMin: 16 * 60, type: "sports" },
  { id: "mockExam", dayOffset: 15, startMin: 9 * 60, endMin: 12 * 60, type: "exam" },
  { id: "departmentPlanning", dayOffset: 18, startMin: 15 * 60 + 30, endMin: 16 * 60 + 30, type: "meeting" },
];

/** The ISO day `days` after another ISO day, in UTC so no offset or DST shifts it. */
export function addDays(isoDay: string, days: number): string {
  const date = new Date(`${isoDay}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** A time of day in minutes as a `Date` that formats in UTC without shifting. */
export function atMinutes(minutes: number): Date {
  return new Date(Date.UTC(2026, 0, 1, 0, minutes));
}
