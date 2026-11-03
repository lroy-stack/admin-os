import { z } from "zod";

import { minuteOfDaySchema } from "@/core/clock";
import { defineSetting } from "@/core/settings";

/** How long a walk-in party is expected to stay. */
export const walkInStayMinutes = defineSetting({
  key: "bookings.walk_in.stay_minutes",
  schema: z.number().int().min(1).max(480),
  defaultValue: 90,
  section: "bookings",
  permission: "update:settings",
  labelKey: "bookings.settings.walkInStay.label",
  descriptionKey: "bookings.settings.walkInStay.description",
});

/** How many minutes after its start a booking that has not arrived counts as late. */
export const lateAfterMinutes = defineSetting({
  key: "bookings.late_after_minutes",
  schema: z.number().int().min(1).max(120),
  defaultValue: 10,
  section: "bookings",
  permission: "update:settings",
  labelKey: "bookings.settings.lateAfter.label",
  descriptionKey: "bookings.settings.lateAfter.description",
});

/** The grid of the time rail. */
export const slotMinutes = defineSetting({
  key: "bookings.slot_minutes",
  schema: z.union([z.literal(5), z.literal(10), z.literal(15), z.literal(20), z.literal(30), z.literal(60)]),
  defaultValue: 15,
  section: "bookings",
  permission: "update:settings",
  labelKey: "bookings.settings.slot.label",
  descriptionKey: "bookings.settings.slot.description",
});

/** The hours of the day when bookings can start, as minutes from the midnight of the business day. */
export const serviceWindow = defineSetting({
  key: "bookings.service_window",
  schema: z
    .strictObject({ startMin: minuteOfDaySchema, endMin: minuteOfDaySchema })
    .refine((window) => window.endMin > window.startMin, { message: "endMin must be after startMin" }),
  defaultValue: { startMin: 19 * 60, endMin: 24 * 60 },
  section: "bookings",
  permission: "update:settings",
  labelKey: "bookings.settings.serviceWindow.label",
  descriptionKey: "bookings.settings.serviceWindow.description",
});

/**
 * How long, in seconds, the server still lets staff undo a walk-in they just seated. The client's undo toast offers
 * 10 s; the server window outlasts it so a tap at the last second, plus network latency, still lands. The business
 * clock counts whole minutes, so the check is by minute and never refuses an undo inside the window.
 */
export const walkInUndoSeconds = defineSetting({
  key: "bookings.walk_in.undo_seconds",
  schema: z.number().int().min(5).max(300),
  defaultValue: 30,
  section: "bookings",
  permission: "update:settings",
  labelKey: "bookings.settings.walkInUndo.label",
  descriptionKey: "bookings.settings.walkInUndo.description",
});

export const bookingsSettings = [
  walkInStayMinutes,
  lateAfterMinutes,
  slotMinutes,
  serviceWindow,
  walkInUndoSeconds,
] as const;
