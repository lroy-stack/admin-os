import "server-only";

import type { ClockSeed } from "@/core/clock";
import { kernelMockHandlers, type MockHandler } from "@/core/mock";
import { createSettingsReader, type SettingsReader } from "@/core/settings";
import { bookingsMockHandlers } from "@/modules/bookings/server";
import { catalogMockHandlers } from "@/modules/catalog/server";
import { customersMockHandlers } from "@/modules/customers/server";
import { notificationsMockHandlers } from "@/modules/notifications/server";
import { resourcesMockHandlers } from "@/modules/resources/server";
import { staffMockHandlers } from "@/modules/staff/server";
import { hospitalityClock, hospitalitySeed } from "@/verticals/hospitality/server";
import { salonClock, salonSeed } from "@/verticals/salon/server";
import { workshopClock, workshopSeed } from "@/verticals/workshop/server";

import { SETTINGS } from "./settings";
import { VERTICALS, type VerticalId } from "./vertical";

/** The settings in effect for a preset: registry defaults with the preset's overrides (ADR 0004). */
export const settingsFor = (vertical: VerticalId): SettingsReader =>
  createSettingsReader(SETTINGS, VERTICALS[vertical].settingsDefaults);

/** The demo data of each preset: its seed collections and its seeded business clock (ADR 0004, 0005). */
export const DEMO = {
  hospitality: { seed: hospitalitySeed, clock: hospitalityClock },
  salon: { seed: salonSeed, clock: salonClock },
  workshop: { seed: workshopSeed, clock: workshopClock },
} as const satisfies Record<VerticalId, { seed: unknown; clock: ClockSeed }>;

export type DemoSeed = (typeof DEMO)[VerticalId]["seed"];

/** Every capability's mock answer; a contract test checks that the catalogue has no capability without one. */
export const MOCK_HANDLERS: Readonly<Record<string, MockHandler<DemoSeed>>> = {
  ...kernelMockHandlers,
  ...bookingsMockHandlers,
  ...catalogMockHandlers,
  ...customersMockHandlers,
  ...notificationsMockHandlers,
  ...resourcesMockHandlers,
  ...staffMockHandlers,
};
