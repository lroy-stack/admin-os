import { z } from "zod";

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

export const bookingsSettings = [walkInStayMinutes, lateAfterMinutes, slotMinutes] as const;
