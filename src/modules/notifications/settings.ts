import { z } from "zod";

import { defineSetting } from "@/core/settings";

/** How many minutes before its start a booking that has not arrived yet is announced as arriving soon. */
export const bookingSoonMinutes = defineSetting({
  key: "notifications.booking_soon_minutes",
  schema: z.number().int().min(5).max(240),
  defaultValue: 30,
  section: "notifications",
  permission: "update:settings",
  labelKey: "notifications.settings.bookingSoon.label",
  descriptionKey: "notifications.settings.bookingSoon.description",
});

export const notificationsSettings = [bookingSoonMinutes] as const;
