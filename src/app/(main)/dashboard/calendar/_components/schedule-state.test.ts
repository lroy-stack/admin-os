import { describe, expect, it } from "vitest";

import {
  createEvent,
  EMPTY_SCHEDULE_STATE,
  type EventFields,
  editEvent,
  inCalendar,
  moveEvent,
  removeEvent,
  resolveEvents,
  restoreEvent,
  restorePatch,
  type ScheduleEvent,
} from "./schedule-state";

const at = (day: number, hour = 9) => new Date(2026, 10, day, hour);

const base: ScheduleEvent[] = [
  { id: "demo-0", title: "Planning", start: at(2), end: at(2, 10), calendar: "team" },
  { id: "demo-1", title: "Review", start: at(3), end: at(3, 11), calendar: "work" },
];

const fields: EventFields = {
  title: "Quay inspection",
  start: at(5),
  end: at(5, 10),
  allDay: false,
  calendar: "personal",
  location: "Harbour",
  notes: "Bring the keys",
};

describe("resolveEvents", () => {
  it("returns the demo events when the session changed nothing", () => {
    expect(resolveEvents(base, EMPTY_SCHEDULE_STATE)).toEqual(base);
  });

  it("appends a created event after the demo events", () => {
    const { state } = createEvent(EMPTY_SCHEDULE_STATE, fields);

    expect(resolveEvents(base, state).map((event) => event.title)).toEqual(["Planning", "Review", "Quay inspection"]);
  });

  it("gives every created event its own id", () => {
    const first = createEvent(EMPTY_SCHEDULE_STATE, fields).state;

    expect(createEvent(first, fields).event.id).toBe("new-2");
  });

  it("applies an edit to a demo event", () => {
    const state = editEvent(EMPTY_SCHEDULE_STATE, "demo-1", { ...fields, title: "Review, moved" });

    expect(resolveEvents(base, state)[1]).toMatchObject({ id: "demo-1", title: "Review, moved", location: "Harbour" });
  });

  it("applies an edit to a created event", () => {
    const created = createEvent(EMPTY_SCHEDULE_STATE, fields);
    const state = editEvent(created.state, created.event.id, { ...fields, title: "Renamed" });

    expect(resolveEvents(base, state)[2].title).toBe("Renamed");
  });

  it("drops a deleted event", () => {
    expect(resolveEvents(base, removeEvent(EMPTY_SCHEDULE_STATE, "demo-0")).map((event) => event.id)).toEqual([
      "demo-1",
    ]);
  });

  it("brings a deleted event back on undo", () => {
    const state = restoreEvent(removeEvent(EMPTY_SCHEDULE_STATE, "demo-0"), "demo-0");

    expect(resolveEvents(base, state)).toEqual(base);
  });
});

describe("moveEvent", () => {
  it("changes only the dates", () => {
    const state = moveEvent(EMPTY_SCHEDULE_STATE, "demo-1", { start: at(6), end: at(6, 11), allDay: false });

    expect(resolveEvents(base, state)[1]).toEqual({ ...base[1], start: at(6), end: at(6, 11), allDay: false });
  });

  it("undo puts back the patch the event had", () => {
    const moved = moveEvent(EMPTY_SCHEDULE_STATE, "demo-1", { start: at(6), end: at(6, 11), allDay: false });

    expect(resolveEvents(base, restorePatch(moved, "demo-1", undefined))).toEqual(base);
  });

  it("undo of a second move returns to the first", () => {
    const first = moveEvent(EMPTY_SCHEDULE_STATE, "demo-1", { start: at(6), end: at(6, 11), allDay: false });
    const second = moveEvent(first, "demo-1", { start: at(7), end: at(7, 11), allDay: false });

    expect(restorePatch(second, "demo-1", first.patches["demo-1"])).toEqual(first);
  });
});

describe("inCalendar", () => {
  it("keeps every event for all", () => {
    expect(inCalendar(base, "all")).toEqual(base);
  });

  it("keeps the events of one calendar", () => {
    expect(inCalendar(base, "work").map((event) => event.id)).toEqual(["demo-1"]);
  });
});
