import { type MessageKey, messageKey, type PageMeta, type Plural } from "@/core/i18n/client";

import type {
  AchievementId,
  ClassStatus,
  EventId,
  EventType,
  HighlightSubject,
  RoomId,
  SubjectId,
} from "./academy-data";

/** Text of /dashboard/academy, including the demo classes, subjects and events. */
export interface AcademyMessages {
  readonly meta: PageMeta;
  readonly title: string;
  readonly greeting: string;
  readonly timeRange: string;
  /** Placeholders: `{section}`, for example "11A". The class name as the school writes it. */
  readonly grade: string;
  /** Short class code for charts. Placeholders: `{section}`. */
  readonly classCode: string;
  readonly kpis: {
    readonly students: string;
    /** Placeholders: `{count}`, the Grade 11 sections. */
    readonly studentsNote: Plural;
    readonly attendance: string;
    readonly attendanceNote: string;
    readonly assignments: string;
    /** Placeholders: `{pending}`, `{overdue}`. */
    readonly assignmentsNote: string;
    readonly classesToday: string;
    /** Placeholders: `{inProgress}`, `{upcoming}`; `{count}` is the cancelled classes and picks the form. */
    readonly classesNote: Plural;
  };
  readonly schedule: {
    readonly title: string;
    readonly viewFull: string;
    /** Placeholders: `{grade}`, `{room}`. */
    readonly classLine: string;
    readonly status: Readonly<Record<ClassStatus, string>>;
  };
  readonly subjects: Readonly<Record<SubjectId, string>>;
  readonly rooms: Readonly<Record<RoomId, string>>;
  readonly assignments: {
    readonly title: string;
    readonly viewReport: string;
    readonly submitted: string;
    readonly pending: string;
    readonly overdue: string;
  };
  readonly performance: {
    readonly title: string;
    readonly viewInsights: string;
    readonly score: string;
    /** Short subject names printed on the bars. */
    readonly subjects: Readonly<Record<HighlightSubject, string>>;
    readonly achievements: Readonly<Record<AchievementId, string>>;
    /** Placeholders: `{achievement}`, `{score}`. */
    readonly studentLine: string;
    /** Placeholders: `{class}`, `{subject}`. */
    readonly classLine: string;
  };
  readonly events: {
    readonly title: string;
    readonly viewCalendar: string;
    readonly items: Readonly<Record<EventId, string>>;
    readonly types: Readonly<Record<EventType, string>>;
  };
}

export const academyMessageKey: MessageKey<AcademyMessages> = messageKey<AcademyMessages>("academy");
