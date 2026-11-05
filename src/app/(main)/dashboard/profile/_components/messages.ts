import type { PageMeta, Plural } from "@/core/i18n";

export type ProfileDocumentId = "doc-1" | "doc-2" | "doc-4";

/** Text of /dashboard/profile: labels, enum values and the demo employee's business text. */
export interface ProfileMessages {
  readonly meta: PageMeta;
  /** The page trail (ADR 0020 §2): its accessible name and the current page; its home level is the nav's. */
  readonly breadcrumb: {
    readonly label: string;
    readonly profile: string;
  };
  readonly tabs: {
    readonly overview: string;
    readonly personal: string;
    readonly employment: string;
    readonly compensation: string;
    readonly timeOff: string;
    readonly documents: string;
  };
  readonly restricted: { readonly title: string; readonly description: string };
  readonly header: {
    /** Placeholders: `{percent}`. */
    readonly complete: string;
    /** Placeholders: `{percent}`. Read by screen readers next to the progress ring. */
    readonly completeSr: string;
    readonly verified: string;
    readonly email: string;
  };
  readonly overview: {
    readonly about: string;
    readonly workDetails: string;
    readonly contractorId: string;
    readonly engagementStatus: string;
    readonly jobLevel: string;
    readonly department: string;
    readonly team: string;
    readonly currentProject: string;
    readonly startDate: string;
    readonly engagementLength: string;
    readonly reportingLine: string;
    readonly directManager: string;
  };
  readonly status: {
    readonly recordStatus: string;
    readonly activeContractor: string;
    readonly accessActive: string;
    /** Placeholders: `{date}`, `{name}`. */
    readonly updated: string;
    readonly upcomingEvents: string;
    readonly timeOff: string;
    readonly lastWorkingDay: string;
  };
  readonly personal: {
    readonly information: string;
    readonly private: string;
    readonly preferredName: string;
    readonly dateOfBirth: string;
    readonly legalName: string;
    readonly personalEmail: string;
    readonly pronouns: string;
    readonly workPhone: string;
    readonly addressAndEmergency: string;
    readonly homeAddress: string;
    readonly emergencyContact: string;
    readonly emergencyPhone: string;
  };
  readonly employment: {
    readonly roleAndOrganization: string;
    readonly jobTitle: string;
    readonly team: string;
    readonly jobLevel: string;
    readonly manager: string;
    readonly department: string;
    readonly currentProject: string;
    readonly contractDetails: string;
    readonly contractorId: string;
    readonly engagementStatus: string;
    readonly employmentType: string;
    readonly contractingEntity: string;
    readonly startDate: string;
    readonly lastWorkingDay: string;
    readonly noticePeriod: string;
    readonly workArrangement: string;
    readonly workplace: string;
    readonly timeZone: string;
    readonly weeklyHours: string;
    readonly schedule: string;
  };
  readonly timeOff: {
    readonly leaveBalance: string;
    readonly policy: string;
    readonly carriedOver: string;
    readonly annualAllowance: string;
    readonly usedThisYear: string;
    readonly remaining: string;
    readonly scheduled: string;
    readonly upcomingAndApprovals: string;
    readonly nextLeave: string;
    readonly pendingRequests: string;
    readonly leaveYear: string;
    readonly approver: string;
  };
  readonly documents: {
    readonly title: string;
    readonly caption: string;
    readonly document: string;
    readonly category: string;
    readonly updated: string;
    readonly status: string;
    readonly access: string;
    readonly restricted: string;
    readonly statuses: { readonly signed: string; readonly current: string };
  };
  /** Shapes of values built from data. */
  readonly values: {
    readonly active: string;
    /** Placeholders: `{count}`. */
    readonly years: Plural;
    /** Placeholders: `{count}`. */
    readonly months: Plural;
    /** Placeholders: `{count}`. */
    readonly days: Plural;
    /** Placeholders: `{count}`. */
    readonly hours: Plural;
    /** Placeholders: `{from}`, `{to}` (dates). */
    readonly dateRange: string;
    /** Placeholders: `{firstDay}`, `{lastDay}`, `{start}`, `{end}`. */
    readonly schedule: string;
    /** Placeholders: `{name}`, `{relation}`. */
    readonly contact: string;
  };
  /** The demo employee's business text. Names, e-mail addresses, phone numbers and addresses are data. */
  readonly demo: {
    readonly pronouns: string;
    readonly jobTitle: string;
    readonly jobLevel: string;
    readonly department: string;
    readonly team: string;
    readonly currentProject: string;
    readonly workplace: string;
    readonly employmentType: string;
    readonly leavePolicy: string;
    readonly managerRole: string;
    readonly emergencyRelation: string;
    readonly bio: string;
    readonly documents: Readonly<Record<ProfileDocumentId, { readonly name: string; readonly category: string }>>;
  };
}
