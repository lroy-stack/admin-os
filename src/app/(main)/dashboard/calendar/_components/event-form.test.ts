import { describe, expect, it } from "vitest";

import { emptyEventForm, eventFormSchema, eventToForm, formToFields, presetFromNow } from "./event-form";
import type { ScheduleEvent } from "./schedule-state";

const errors = {
  titleRequired: "title",
  calendarInvalid: "calendar",
  dateInvalid: "date",
  timeInvalid: "time",
  endBeforeStart: "order",
};
const schema = eventFormSchema(errors);
const timed = {
  title: " Quay inspection ",
  calendar: "work",
  allDay: false,
  startDate: "2026-11-05",
  startTime: "09:00",
  endDate: "2026-11-05",
  endTime: "10:30",
  location: "",
  notes: "",
};
const issues = (input: unknown) => {
  const result = schema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
};

describe("eventFormSchema", () => {
  it("accepts a timed event and trims the title", () => {
    expect(schema.parse(timed).title).toBe("Quay inspection");
  });

  it("asks for a title", () => {
    expect(issues({ ...timed, title: " " })).toEqual(["title"]);
  });

  it("reports a missing date", () => {
    expect(issues({ ...timed, startDate: "" })).toEqual(["date"]);
  });

  it("reports a time the input cannot hold", () => {
    expect(issues({ ...timed, startTime: "" })).toEqual(["time"]);
  });

  it("asks for an end after the start", () => {
    expect(issues({ ...timed, endTime: "09:00" })).toEqual(["order"]);
  });

  it("accepts an end on a later day with an earlier time", () => {
    expect(issues({ ...timed, endDate: "2026-11-06", endTime: "08:00" })).toEqual([]);
  });

  it("ignores the times of an all-day event", () => {
    expect(issues({ ...timed, allDay: true, startTime: "", endTime: "" })).toEqual([]);
  });

  it("asks for an all-day end on or after the start", () => {
    expect(issues({ ...timed, allDay: true, endDate: "2026-11-04" })).toEqual(["order"]);
  });
});

describe("formToFields", () => {
  it("builds the dates of a timed event in local time", () => {
    const fields = formToFields(schema.parse(timed));

    expect([fields.start, fields.end]).toEqual([new Date(2026, 10, 5, 9, 0), new Date(2026, 10, 5, 10, 30)]);
  });

  it("gives a one-day all-day event no end", () => {
    const fields = formToFields(schema.parse({ ...timed, allDay: true }));

    expect([fields.start, fields.end]).toEqual([new Date(2026, 10, 5), undefined]);
  });

  it("ends a multi-day all-day event the morning after its last day", () => {
    const fields = formToFields(schema.parse({ ...timed, allDay: true, endDate: "2026-11-07" }));

    expect(fields.end).toEqual(new Date(2026, 10, 8));
  });
});

describe("eventToForm", () => {
  const event: ScheduleEvent = {
    id: "demo-0",
    title: "Workshop",
    start: new Date(2026, 10, 7),
    end: new Date(2026, 10, 10),
    allDay: true,
    calendar: "team",
    location: "Room 2",
  };

  it("shows the last day of an all-day range, inclusive", () => {
    expect(eventToForm(event)).toMatchObject({ allDay: true, startDate: "2026-11-07", endDate: "2026-11-09" });
  });

  it("carries the location and leaves the notes empty", () => {
    expect(eventToForm(event)).toMatchObject({ location: "Room 2", notes: "" });
  });

  it("round-trips an all-day event through the form", () => {
    const fields = formToFields(schema.parse(eventToForm(event)));

    expect([fields.start, fields.end]).toEqual([event.start, event.end]);
  });
});

describe("presets", () => {
  it("opens on the hour after now, for an hour", () => {
    expect(emptyEventForm(presetFromNow(new Date(2026, 10, 5, 14, 20)))).toMatchObject({
      startDate: "2026-11-05",
      startTime: "15:00",
      endTime: "16:00",
    });
  });

  it("rolls past midnight into the next day", () => {
    expect(emptyEventForm(presetFromNow(new Date(2026, 10, 5, 23, 40)))).toMatchObject({
      startDate: "2026-11-06",
      startTime: "00:00",
      endDate: "2026-11-06",
    });
  });

  it("opens an all-day drag on its first and last day", () => {
    const form = emptyEventForm({ start: new Date(2026, 10, 12), end: new Date(2026, 10, 15), allDay: true });

    expect(form).toMatchObject({ allDay: true, startDate: "2026-11-12", endDate: "2026-11-14" });
  });
});
