import "server-only";

import type { StoreNamespace } from "./durable-adapter.server";

/** The web Worker's `DEMO_STORE` binding, from the OpenNext context; loaded on demand so tests and stdio never need it. */
export async function webStoreNamespace(): Promise<StoreNamespace | undefined> {
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  return (getCloudflareContext().env as { DEMO_STORE?: StoreNamespace }).DEMO_STORE;
}
