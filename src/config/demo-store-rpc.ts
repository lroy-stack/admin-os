import type { Actor, CallContext } from "@/core/client";
import type { Fault } from "@/core/mock";
import type { CallResult } from "@/core/result";

import { CATALOG } from "./catalog";
import type { VerticalId } from "./vertical";

/** What crosses the RPC: the parts of `CallContext` that can be cloned (the abort signal stays on the caller). */
export interface StoreCallContext {
  readonly vertical: VerticalId;
  readonly sessionId: string;
  readonly actor: Actor;
  readonly correlationId: string;
  readonly idempotencyKey?: string;
  readonly via: CallContext["via"];
  readonly faults?: readonly (readonly [string, Fault])[];
  /** The caller's `MOCK_CLOCK=live`, so the store and the caller's in-process reads share one clock. */
  readonly clockLive: boolean;
  /** The caller's catalogue; the store refuses a call from another version instead of misreading it. */
  readonly catalogVersion: string;
}

/** The Durable Object's RPC surface, as the callers see it. */
export interface DemoStoreRpc {
  dispatch(capabilityId: string, input: unknown, context: StoreCallContext): Promise<CallResult<unknown>>;
}

/** FNV-1a over the sorted capability ids and their effects: changes whenever the catalogue's shape does. */
export const catalogVersion = (): string => {
  const text = Object.values(CATALOG)
    .map((capability) => `${capability.id}:${capability.effect}`)
    .sort()
    .join("|");
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193) >>> 0;
  return hash.toString(16);
};
