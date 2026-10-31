import { setDate, setHours, setMinutes, startOfMonth } from "date-fns";

import { format, type Locale } from "@/core/i18n/client";

import type { CalendarMessages } from "./messages";

export type DemoEvent = {
  groupId?: string;
  title: string;
  start: Date;
  end?: Date;
  allDay?: boolean;
  display?: "background";
};

/**
 * The demo month for `today`, with titles in one locale (`names` is the dictionary's `demoEvents`). Built on the
 * client, in the device's time zone, like the browser-built dates of the other widgets.
 */
export function createDemoEvents(names: CalendarMessages["demoEvents"], locale: Locale, today: Date): DemoEvent[] {
  const monthStart = startOfMonth(today);
  const d = (day: number) => setDate(monthStart, day);
  const dt = (day: number, hour: number, min = 0) => setMinutes(setHours(setDate(monthStart, day), hour), min);

  return [
    { title: names.monthlyPlanning, start: dt(1, 9, 30), end: dt(1, 10, 30) },
    { title: names.designReview, start: dt(3, 11), end: dt(3, 12) },
    { title: names.clientCheckIn, start: dt(4, 15), end: dt(4, 15, 45) },
    { title: names.productWorkshop, start: d(7), end: d(9), allDay: true },
    { groupId: "standup", title: names.standup, start: dt(9, 10) },
    { title: names.financeSync, start: dt(10, 14, 30), end: dt(10, 15) },
    { title: names.focusBlock, start: dt(12, 9), end: dt(12, 12), display: "background" },
    { title: names.sprintPlanning, start: dt(15, 9, 30), end: dt(15, 11) },
    { groupId: "standup", title: names.standup, start: dt(16, 10) },
    { title: names.opsHandoff, start: dt(18, 16), end: dt(18, 16, 45) },
    { title: names.quarterlyReport, start: d(24), allDay: true },
    { title: names.resetDay, start: d(28), allDay: true },
    {
      title: format(names.birthday, locale, { name: "Alex Morgan" }),
      start: new Date(today.getFullYear(), 8, 6),
      allDay: true,
    },
  ];
}
