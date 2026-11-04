import { type MessageKey, messageKey, type PageMeta, type Plural } from "@/core/i18n/client";

import type { EventFormErrors } from "./event-form";

/** Text of /dashboard/calendar (Team Schedule), including its demo events. */
export interface CalendarMessages {
  readonly meta: PageMeta;
  readonly title: string;
  readonly kpis: {
    /** Placeholders: `{count}`, the number of days in the visible range. */
    readonly eventsInDays: Plural;
    readonly booked: string;
    readonly focus: string;
    /** Placeholders: `{hours}`. */
    readonly hours: string;
  };
  readonly stepper: {
    readonly label: string;
    readonly previous: string;
    readonly today: string;
    readonly next: string;
  };
  readonly filter: {
    readonly label: string;
    readonly all: string;
    readonly work: string;
    readonly personal: string;
    readonly team: string;
    readonly focus: string;
  };
  readonly views: {
    readonly label: string;
    readonly month: string;
    readonly week: string;
    readonly day: string;
  };
  readonly addEvent: string;
  readonly sidebar: {
    readonly upNext: string;
    readonly nothingScheduled: string;
    readonly allDay: string;
    /** Placeholders: `{start}`, `{end}`. */
    readonly timeRange: string;
    readonly closingSoon: string;
    readonly openPipeline: string;
  };
  /** The windows of an event: its details, the New event and Edit event form, the delete confirmation and the toasts. */
  readonly event: {
    readonly details: string;
    readonly when: string;
    readonly calendar: string;
    readonly location: string;
    readonly notes: string;
    readonly edit: string;
    readonly delete: string;
    /** Placeholders: `{date}`, `{time}`: a timed event within one day. */
    readonly timed: string;
    /** Placeholders: `{start}`, `{end}`: an event over several days. */
    readonly range: string;
    readonly form: {
      readonly createTitle: string;
      readonly createVerb: string;
      readonly editTitle: string;
      readonly editVerb: string;
      readonly description: string;
      readonly title: string;
      readonly allDay: string;
      readonly startDate: string;
      readonly startTime: string;
      readonly endDate: string;
      readonly endTime: string;
      readonly location: string;
      readonly notes: string;
      readonly errors: EventFormErrors;
    };
    readonly confirm: {
      readonly title: string;
      readonly verb: string;
      /** Placeholders: `{title}`. Says the data is the demo's. */
      readonly consequence: string;
    };
    /** Each confirmation of a change a person can undo. Placeholders: `{title}`. */
    readonly toast: {
      readonly created: string;
      readonly saved: string;
      readonly deleted: string;
      readonly moved: string;
    };
  };
  /** Demo events: text a business writes in its own language. */
  readonly demoEvents: {
    readonly monthlyPlanning: string;
    readonly designReview: string;
    readonly clientCheckIn: string;
    readonly productWorkshop: string;
    readonly standup: string;
    readonly financeSync: string;
    readonly focusBlock: string;
    readonly sprintPlanning: string;
    readonly opsHandoff: string;
    readonly quarterlyReport: string;
    readonly resetDay: string;
    /** Placeholders: `{name}`. */
    readonly birthday: string;
  };
}

export const calendarMessageKey: MessageKey<CalendarMessages> = messageKey<CalendarMessages>("calendar");
