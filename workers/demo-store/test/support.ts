import { ownerOf } from "@/config/adapter-contract.testkit";
import { CATALOG } from "@/config/catalog";
import { DEMO, MOCK_HANDLERS, settingsFor } from "@/config/demo-kernel";
import { catalogVersion, type StoreCallContext } from "@/config/demo-store-rpc";
import { durableAdapter, type StoreNamespace } from "@/config/durable-adapter.server";
import type { Adapter } from "@/core/client";
import { createClient } from "@/core/client";
import { fixedClock } from "@/core/clock";
import { createMockAdapter, createSessionStore } from "@/core/mock";

import { env } from "cloudflare:workers";

const VERTICAL = "hospitality";

/** The seed every test starts from: the object for a name nobody has written to. */
export const stubFor = (sessionId: string) => env.DEMO_STORE.get(env.DEMO_STORE.idFromName(`${VERTICAL}:${sessionId}`));

/** The web app's adapter over the real binding; session-free reads run in process, as in production. */
export const durableAdapterFor = (vertical: "hospitality" | "salon" | "workshop", sessionId: string): Adapter => {
  const { seed, clock } = DEMO[vertical];
  return durableAdapter({
    vertical,
    sessionId,
    namespace: env.DEMO_STORE as unknown as StoreNamespace,
    inProcess: createMockAdapter({
      handlers: MOCK_HANDLERS,
      store: createSessionStore(seed),
      sessionId,
      clock: fixedClock(clock),
      settings: settingsFor(vertical),
    }),
  });
};

/** A typed client for one visitor session of the hospitality preset, acting as its owner. */
export const clientFor = (sessionId: string) =>
  createClient(CATALOG, durableAdapterFor(VERTICAL, sessionId), {
    actor: ownerOf(VERTICAL),
    retryDelayMs: 0,
    logger: () => undefined,
    mode: "production",
  });

/** A context the store accepts, for calls that bypass the client. */
export const contextFor = (sessionId: string, overrides: Partial<StoreCallContext> = {}): StoreCallContext => ({
  vertical: VERTICAL,
  sessionId,
  actor: ownerOf(VERTICAL),
  correlationId: "test",
  via: "ui",
  clockLive: false,
  catalogVersion: catalogVersion(),
  ...overrides,
});
