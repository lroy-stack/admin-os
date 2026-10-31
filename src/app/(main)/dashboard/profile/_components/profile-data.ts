import {
  format,
  formatCalendarDate,
  formatList,
  formatNumber,
  formatTime,
  type Locale,
  weekdayNames,
} from "@/core/i18n";

import type { ProfileDocumentId, ProfileMessages } from "./messages";

interface PersonReference {
  name: string;
  role: string;
  initials: string;
}

export interface ProfileDocument {
  id: ProfileDocumentId;
  name: string;
  category: string;
  updatedAt: string;
  status: "signed" | "current";
  isRestricted: boolean;
}

/** What does not depend on the language: ids, numbers and calendar days (YYYY-MM-DD). The text is in the dictionary. */
export const profileFacts = {
  name: "Alex Morgan",
  preferredName: "Alex",
  legalName: "Alex Morgan",
  initials: "AK",
  avatar: "",
  completeness: 0.92,
  workEmail: "alex.morgan@example.com",
  personalEmail: "alex.personal@example.com",
  workPhone: "+1 (415) 555-0148",
  timeZone: "UTC+5:30",
  contractorId: "WS-2301",
  startDate: "2022-03-18",
  engagementLength: { years: 4, months: 4 },
  weeklyHours: 40,
  schedule: { firstDay: 1, lastDay: 5, start: "09:00", end: "17:30" },
  contractingEntity: "Studio Technologies Pte. Ltd.",
  noticePeriodDays: 30,
  dateOfBirth: "1993-09-09",
  address: "1842 Valencia Street, San Francisco, CA 94110",
  emergencyContactName: "Ammar K.",
  emergencyPhone: "+1 (510) 555-0177",
  manager: { name: "Pravi K.", initials: "PK" },
  annualLeaveAllowanceDays: 25,
  remainingLeaveDays: 18,
  carriedOverLeaveDays: 0,
  usedLeaveDays: 7,
  scheduledLeaveDays: 5,
  pendingLeaveRequests: 0,
  leaveYear: { from: "2026-01-01", to: "2026-12-31" },
  nextLeave: { from: "2026-08-24", to: "2026-08-28" },
  lastWorkingDay: "2026-10-03",
  updatedBy: "Alex Morgan",
  updatedAt: "2026-08-08",
  documents: [
    { id: "doc-1", updatedAt: "2022-03-18", status: "signed", isRestricted: false },
    { id: "doc-2", updatedAt: "2022-03-18", status: "signed", isRestricted: true },
    { id: "doc-4", updatedAt: "2026-01-08", status: "current", isRestricted: false },
  ],
} as const;

/** The profile as the page shows it: every value is already text in the request's language. */
export interface ProfileRecord {
  name: string;
  preferredName: string;
  legalName: string;
  pronouns: string;
  initials: string;
  avatar: string;
  completeness: number;
  engagementStatus: string;
  jobTitle: string;
  jobLevel: string;
  department: string;
  team: string;
  currentProject: string;
  workEmail: string;
  personalEmail: string;
  workPhone: string;
  workplace: string;
  timeZone: string;
  contractorId: string;
  startDate: string;
  engagementLength: string;
  employmentType: string;
  weeklyHours: string;
  schedule: string;
  contractingEntity: string;
  noticePeriod: string;
  dateOfBirth: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  manager: PersonReference;
  bio: string;
  leavePolicy: string;
  annualLeaveAllowance: string;
  remainingLeave: string;
  carriedOverLeave: string;
  usedLeave: string;
  scheduledLeave: string;
  pendingLeaveRequests: string;
  leaveYear: string;
  nextLeave: string;
  lastWorkingDay: string;
  updatedBy: string;
  updatedAt: string;
  documents: ProfileDocument[];
}

/** Month names and weekday names are lowercase in es and fr; a value that opens a field starts with a capital. */
function capitalize(text: string, locale: Locale): string {
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}

/** A time of day ("17:30") in the locale's clock style; the zone is irrelevant because it carries no date. */
function timeOfDay(time: string, locale: Locale): string {
  return formatTime(new Date(`2026-01-05T${time}:00Z`), locale, "UTC");
}

/** The demo employee in one language. Dates and numbers go through `Intl`; the rest comes from the dictionary. */
export function localizeProfile(text: ProfileMessages, locale: Locale): ProfileRecord {
  const facts = profileFacts;
  const day = (isoDay: string) => formatCalendarDate(isoDay, locale, { dateStyle: "long" });
  const shortDay = (isoDay: string) => formatCalendarDate(isoDay, locale);
  const range = (from: string, to: string) =>
    format(text.values.dateRange, locale, { from: shortDay(from), to: shortDay(to) });
  const days = (count: number) => format(text.values.days, locale, { count });
  const weekdays = weekdayNames(locale);

  return {
    name: facts.name,
    preferredName: facts.preferredName,
    legalName: facts.legalName,
    pronouns: text.demo.pronouns,
    initials: facts.initials,
    avatar: facts.avatar,
    completeness: facts.completeness,
    engagementStatus: text.values.active,
    jobTitle: text.demo.jobTitle,
    jobLevel: text.demo.jobLevel,
    department: text.demo.department,
    team: text.demo.team,
    currentProject: text.demo.currentProject,
    workEmail: facts.workEmail,
    personalEmail: facts.personalEmail,
    workPhone: facts.workPhone,
    workplace: text.demo.workplace,
    timeZone: facts.timeZone,
    contractorId: facts.contractorId,
    startDate: day(facts.startDate),
    engagementLength: formatList(
      [
        format(text.values.years, locale, { count: facts.engagementLength.years }),
        format(text.values.months, locale, { count: facts.engagementLength.months }),
      ],
      locale,
    ),
    employmentType: text.demo.employmentType,
    weeklyHours: format(text.values.hours, locale, { count: facts.weeklyHours }),
    schedule: capitalize(
      format(text.values.schedule, locale, {
        firstDay: weekdays[facts.schedule.firstDay] ?? "",
        lastDay: weekdays[facts.schedule.lastDay] ?? "",
        start: timeOfDay(facts.schedule.start, locale),
        end: timeOfDay(facts.schedule.end, locale),
      }),
      locale,
    ),
    contractingEntity: facts.contractingEntity,
    noticePeriod: days(facts.noticePeriodDays),
    dateOfBirth: day(facts.dateOfBirth),
    address: facts.address,
    emergencyContact: format(text.values.contact, locale, {
      name: facts.emergencyContactName,
      relation: text.demo.emergencyRelation,
    }),
    emergencyPhone: facts.emergencyPhone,
    manager: { name: facts.manager.name, role: text.demo.managerRole, initials: facts.manager.initials },
    bio: text.demo.bio,
    leavePolicy: text.demo.leavePolicy,
    annualLeaveAllowance: days(facts.annualLeaveAllowanceDays),
    remainingLeave: days(facts.remainingLeaveDays),
    carriedOverLeave: days(facts.carriedOverLeaveDays),
    usedLeave: days(facts.usedLeaveDays),
    scheduledLeave: days(facts.scheduledLeaveDays),
    pendingLeaveRequests: formatNumber(facts.pendingLeaveRequests, locale),
    leaveYear: range(facts.leaveYear.from, facts.leaveYear.to),
    nextLeave: range(facts.nextLeave.from, facts.nextLeave.to),
    lastWorkingDay: day(facts.lastWorkingDay),
    updatedBy: facts.updatedBy,
    updatedAt: day(facts.updatedAt),
    documents: facts.documents.map((document) => ({
      ...document,
      name: text.demo.documents[document.id].name,
      category: text.demo.documents[document.id].category,
      updatedAt: shortDay(document.updatedAt),
    })),
  };
}
