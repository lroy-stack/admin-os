import "server-only";

import { z } from "zod";

import type { Adapter } from "@/core/client";
import { fixedClock, liveClock } from "@/core/clock";
import { createMockAdapter, createSessionStore, type FaultMap, type SessionStore } from "@/core/mock";

import { DEMO, type DemoSeed, heldWritesFor, MOCK_HANDLERS, settingsFor } from "./demo-kernel";
import { durableAdapter, type StoreLookup } from "./durable-adapter.server";
import type { VerticalId } from "./vertical";

export { MOCK_HANDLERS, settingsFor };

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

/** The variables `getAdapter` reads: `process.env` in Node and Next, the Worker's `env` in a Worker. */
export type DataEnv = Readonly<Record<string, unknown>>;

/** The demo build runs on the mock adapter; only then are the visitor's demo switches (role, preset, reset) honoured. */
export const isDemoAdapter = (): boolean => adapterKindSchema.safeParse(process.env.DATA_ADAPTER || undefined).success;

/**
 * The adapter for this request. `DATA_ADAPTER` selects it (only `mock` ships with the kit; a real backend adds its
 * own here), `MOCK_CLOCK=live` swaps the seeded moment for real time. With `DATA_STORE=durable` a request that has
 * a demo session goes to that session's Durable Object, found through `store`; one without a session reads the seed in
 * process.
 */
export function getAdapter(
  options: {
    readonly vertical: VerticalId;
    readonly sessionId?: string;
    readonly faults?: FaultMap;
    /** Where the `DEMO_STORE` binding comes from; without one a durable call answers `transport.unavailable`. */
    readonly store?: StoreLookup;
  },
  env: DataEnv = process.env,
): Adapter {
  const kind = adapterKindSchema.safeParse(env.DATA_ADAPTER || undefined);
  if (!kind.success) {
    throw new Error(
      `DATA_ADAPTER "${String(env.DATA_ADAPTER)}" is not available; the kit ships "mock". Add your adapter in src/config/data.server.ts.`,
    );
  }
  const { clock } = DEMO[options.vertical];
  const clockLive = env.MOCK_CLOCK === "live";
  const inProcess = createMockAdapter({
    handlers: MOCK_HANDLERS,
    store: storeFor(options.vertical),
    sessionId: options.sessionId,
    clock: clockLive ? liveClock(clock, new Date()) : fixedClock(clock),
    settings: settingsFor(options.vertical),
    heldWrites: heldWritesFor(options.vertical),
    faults: options.faults,
  });
  if (env.DATA_STORE === "durable" && options.sessionId !== undefined) {
    return durableAdapter({
      vertical: options.vertical,
      sessionId: options.sessionId,
      faults: options.faults,
      clockLive,
      inProcess,
      namespace: options.store ?? (() => undefined),
    });
  }
  return inProcess;
}

/** Drops one demo session's copy, so its next read sees the seed again (ADR 0005). */
export function resetDemoData(vertical: VerticalId, sessionId: string): void {
  storeFor(vertical).reset(sessionId);
}
