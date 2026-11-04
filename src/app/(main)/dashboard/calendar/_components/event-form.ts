import { addDays, addHours, format, parse, startOfHour, subDays } from "date-fns";
import { z } from "zod";

import { type EventFields, eventCalendars, type ScheduleEvent } from "./schedule-state";

/** The errors the schema reports, already translated. */
export interface EventFormErrors {
  readonly titleRequired: string;
  readonly calendarInvalid: string;
  readonly dateInvalid: string;
  readonly timeInvalid: string;
  readonly endBeforeStart: string;
}

const DAY = "yyyy-MM-dd";
const TIME = "HH:mm";
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * The New event and Edit event form. Dates and times are typed as text (the native inputs' values) and turned into
 * dates by `formToFields`, so the schema reports an empty field in the dictionary's words. An all-day event ends on its
 * last day (inclusive); a timed one ends after it starts.
 */
export function eventFormSchema(errors: EventFormErrors) {
  return z
    .object({
      title: z.string().trim().min(1, errors.titleRequired),
      calendar: z.enum(eventCalendars, { error: errors.calendarInvalid }),
      allDay: z.boolean(),
      startDate: z.iso.date({ error: errors.dateInvalid }),
      startTime: z.string(),
      endDate: z.iso.date({ error: errors.dateInvalid }),
      endTime: z.string(),
      location: z.string().trim(),
      notes: z.string().trim(),
    })
    .superRefine((values, context) => {
      // A missing or impossible date is reported on its own field; the order is only judged between two real days.
      if (!z.iso.date().safeParse(values.startDate).success || !z.iso.date().safeParse(values.endDate).success) return;
      if (values.allDay) {
        if (values.endDate < values.startDate) {
          context.addIssue({ code: "custom", path: ["endDate"], message: errors.endBeforeStart });
        }
        return;
      }
      if (!TIME_PATTERN.test(values.startTime)) {
        context.addIssue({ code: "custom", path: ["startTime"], message: errors.timeInvalid });
      }
      if (!TIME_PATTERN.test(values.endTime)) {
        context.addIssue({ code: "custom", path: ["endTime"], message: errors.timeInvalid });
        return;
      }
      if (`${values.endDate}T${values.endTime}` <= `${values.startDate}T${values.startTime}`) {
        context.addIssue({ code: "custom", path: ["endTime"], message: errors.endBeforeStart });
      }
    });
}

export type EventFormInput = z.input<ReturnType<typeof eventFormSchema>>;
export type EventFormValues = z.output<ReturnType<typeof eventFormSchema>>;

/** What opens the form on a time: a click or a drag on the calendar, or `now`. `end` of an all-day range is exclusive. */
export interface EventPreset {
  readonly start: Date;
  readonly end?: Date;
  readonly allDay: boolean;
}

/** The hour after `now`, for an hour. The Add event button opens on it. */
export function presetFromNow(now: Date): EventPreset {
  const start = addHours(startOfHour(now), 1);
  return { start, end: addHours(start, 1), allDay: false };
}

function formFor(fields: Pick<EventFields, "title" | "calendar" | "location" | "notes"> & EventPreset): EventFormInput {
  const end = fields.end ?? addHours(fields.start, 1);
  const lastAllDay = fields.end ? subDays(fields.end, 1) : fields.start;
  const lastDay = fields.allDay ? lastAllDay : end;
  return {
    title: fields.title,
    calendar: fields.calendar,
    allDay: fields.allDay,
    startDate: format(fields.start, DAY),
    startTime: format(fields.start, TIME),
    endDate: format(lastDay, DAY),
    endTime: format(end, TIME),
    location: fields.location,
    notes: fields.notes,
  };
}

/** A blank form on a preset. */
export function emptyEventForm(preset: EventPreset): EventFormInput {
  return formFor({ ...preset, title: "", calendar: "work", location: "", notes: "" });
}

export function eventToForm(event: ScheduleEvent): EventFormInput {
  return formFor({
    title: event.title,
    calendar: event.calendar,
    location: event.location ?? "",
    notes: event.notes ?? "",
    start: event.start,
    end: event.end,
    allDay: event.allDay === true,
  });
}

const dateAt = (day: string, time: string) => parse(`${day} ${time}`, `${DAY} ${TIME}`, new Date(0));

/** The parsed form as the fields an event carries. */
export function formToFields(values: EventFormValues): EventFields {
  const base = { title: values.title, calendar: values.calendar, location: values.location, notes: values.notes };
  if (values.allDay) {
    const start = dateAt(values.startDate, "00:00");
    const lastDay = dateAt(values.endDate, "00:00");
    return { ...base, allDay: true, start, end: lastDay > start ? addDays(lastDay, 1) : undefined };
  }
  return {
    ...base,
    allDay: false,
    start: dateAt(values.startDate, values.startTime),
    end: dateAt(values.endDate, values.endTime),
  };
}
