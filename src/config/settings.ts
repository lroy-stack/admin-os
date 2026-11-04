import { approvalsSettings } from "@/core/approvals";
import { businessSettings } from "@/core/business";
import { mergeSettings } from "@/core/settings";
import { bookingsSettings } from "@/modules/bookings";
import { notificationsSettings } from "@/modules/notifications";

/** Every setting the kit ships; a preset overrides defaults through `settingsDefaults` (ADR 0004). */
export const SETTINGS = mergeSettings(
  ...approvalsSettings,
  ...businessSettings,
  ...bookingsSettings,
  ...notificationsSettings,
);
