import { setDate, setHours, setMinutes, startOfMonth } from "date-fns";

import { format, type Locale } from "@/core/i18n/client";

import type { CalendarMessages } from "./messages";
import type { EventCalendar, ScheduleEvent } from "./schedule-state";

export type DemoEvent = ScheduleEvent;

/**
 * The demo month for `today`, with titles in one locale (`names` is the dictionary's `demoEvents`). Built on the
 * client, in the device's time zone, like the browser-built dates of the other widgets. Ids follow the order below, so
 * a language change keeps what the session did to each event.
 */
export function createDemoEvents(names: CalendarMessages["demoEvents"], locale: Locale, today: Date): DemoEvent[] {
  const monthStart = startOfMonth(today);
  const d = (day: number) => setDate(monthStart, day);
  const dt = (day: number, hour: number, min = 0) => setMinutes(setHours(setDate(monthStart, day), hour), min);
  const demo = (index: number, calendar: EventCalendar, event: Omit<DemoEvent, "id" | "calendar">): DemoEvent => ({
    id: `demo-${index}`,
    calendar,
    ...event,
  });

  return [
    demo(0, "team", { title: names.monthlyPlanning, start: dt(1, 9, 30), end: dt(1, 10, 30) }),
    demo(1, "work", { title: names.designReview, start: dt(3, 11), end: dt(3, 12) }),
    demo(2, "work", { title: names.clientCheckIn, start: dt(4, 15), end: dt(4, 15, 45) }),
    demo(3, "team", { title: names.productWorkshop, start: d(7), end: d(9), allDay: true }),
    demo(4, "team", { groupId: "standup", title: names.standup, start: dt(9, 10) }),
    demo(5, "work", { title: names.financeSync, start: dt(10, 14, 30), end: dt(10, 15) }),
    demo(6, "focus", { title: names.focusBlock, start: dt(12, 9), end: dt(12, 12), display: "background" }),
    demo(7, "team", { title: names.sprintPlanning, start: dt(15, 9, 30), end: dt(15, 11) }),
    demo(8, "team", { groupId: "standup", title: names.standup, start: dt(16, 10) }),
    demo(9, "work", { title: names.opsHandoff, start: dt(18, 16), end: dt(18, 16, 45) }),
    demo(10, "work", { title: names.quarterlyReport, start: d(24), allDay: true }),
    demo(11, "personal", { title: names.resetDay, start: d(28), allDay: true }),
    demo(12, "personal", {
      title: format(names.birthday, locale, { name: "Alex Morgan" }),
      start: new Date(today.getFullYear(), 8, 6),
      allDay: true,
    }),
  ];
}
