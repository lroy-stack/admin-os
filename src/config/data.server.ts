import "server-only";

import { z } from "zod";

import type { Adapter } from "@/core/client";
import { type ClockSeed, fixedClock, liveClock } from "@/core/clock";
import {
  createMockAdapter,
  createSessionStore,
  type FaultMap,
  kernelMockHandlers,
  type MockHandler,
  type SessionStore,
} from "@/core/mock";
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
const DEMO = {
  hospitality: { seed: hospitalitySeed, clock: hospitalityClock },
  salon: { seed: salonSeed, clock: salonClock },
  workshop: { seed: workshopSeed, clock: workshopClock },
} as const satisfies Record<VerticalId, { seed: unknown; clock: ClockSeed }>;

type DemoSeed = (typeof DEMO)[VerticalId]["seed"];

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

/** One store per preset and process: visitors' copies live here until their TTL or a reset (ADR 0005). */
const stores = new Map<VerticalId, SessionStore<DemoSeed>>();

const storeFor = (vertical: VerticalId): SessionStore<DemoSeed> => {
  const existing = stores.get(vertical);
  if (existing) return existing;
  const created = createSessionStore<DemoSeed>(DEMO[vertical].seed);
  stores.set(vertical, created);
  return created;
};

const adapterKindSchema = z.enum(["mock"]).default("mock");

/** The demo build runs on the mock adapter; only then are the visitor's demo switches (role, preset, reset) honoured. */
export const isDemoAdapter = (): boolean => adapterKindSchema.safeParse(process.env.DATA_ADAPTER || undefined).success;

/**
 * The adapter for this request. `DATA_ADAPTER` selects it (only `mock` ships with the kit; a real backend adds its
 * own here), `MOCK_CLOCK=live` swaps the seeded moment for real time.
 */
export function getAdapter(options: {
  readonly vertical: VerticalId;
  readonly sessionId?: string;
  readonly faults?: FaultMap;
}): Adapter {
  const kind = adapterKindSchema.safeParse(process.env.DATA_ADAPTER || undefined);
  if (!kind.success) {
    throw new Error(
      `DATA_ADAPTER "${process.env.DATA_ADAPTER}" is not available; the kit ships "mock". Add your adapter in src/config/data.server.ts.`,
    );
  }
  const { clock } = DEMO[options.vertical];
  return createMockAdapter({
    handlers: MOCK_HANDLERS,
    store: storeFor(options.vertical),
    sessionId: options.sessionId,
    clock: process.env.MOCK_CLOCK === "live" ? liveClock(clock, new Date()) : fixedClock(clock),
    settings: settingsFor(options.vertical),
    faults: options.faults,
  });
}

/** Drops one demo session's copy, so its next read sees the seed again (ADR 0005). */
export function resetDemoData(vertical: VerticalId, sessionId: string): void {
  storeFor(vertical).reset(sessionId);
}
