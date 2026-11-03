import { mergeSettings } from "@/core/settings";
import { bookingsSettings } from "@/modules/bookings";

/** Every setting the kit ships; a preset overrides defaults through `settingsDefaults` (ADR 0004). */
export const SETTINGS = mergeSettings(...bookingsSettings);
