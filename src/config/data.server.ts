import "server-only";

import { cookies } from "next/headers";

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
import { bookingsMockHandlers } from "@/modules/bookings/server";
import { catalogMockHandlers } from "@/modules/catalog/server";
import { customersMockHandlers } from "@/modules/customers/server";
import { resourcesMockHandlers } from "@/modules/resources/server";
import { staffMockHandlers } from "@/modules/staff/server";
import { hospitalityClock, hospitalitySeed } from "@/verticals/hospitality/server";
import { salonClock, salonSeed } from "@/verticals/salon/server";
import { workshopClock, workshopSeed } from "@/verticals/workshop/server";

import type { VerticalId } from "./vertical";

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
  ...resourcesMockHandlers,
  ...staffMockHandlers,
};

/** httpOnly: only Server Actions and the server read it. */
export const DEMO_SESSION_COOKIE = "demo_session";
const DEMO_SESSION_MAX_AGE_S = 2 * 60 * 60;

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
    faults: options.faults,
  });
}

/** For Server Actions before a write: the visitor's demo session, started on the first write. */
export async function ensureDemoSession(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(DEMO_SESSION_COOKIE)?.value;
  if (existing) return existing;
  const sessionId = crypto.randomUUID();
  jar.set(DEMO_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: DEMO_SESSION_MAX_AGE_S,
  });
  return sessionId;
}

/** "Reset demo data": the visitor's copy is dropped, so the next read sees the seed again. */
export async function resetDemoSession(vertical: VerticalId): Promise<void> {
  const sessionId = (await cookies()).get(DEMO_SESSION_COOKIE)?.value;
  if (sessionId) storeFor(vertical).reset(sessionId);
}
