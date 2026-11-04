import { z } from "zod";

import { idempotencyKeySchema } from "@/core/client";
import type { CallResult } from "@/core/result";

import { CATALOG } from "./catalog";
import { verticalIdSchema } from "./vertical";

/** The longest a forced latency fault may hold a store call: the object serves one visitor, and a hold blocks it. */
export const MAX_STORE_FAULT_LATENCY_MS = 1000;

/**
 * What crosses the RPC: the parts of `CallContext` that can be cloned (the abort signal stays on the caller). The
 * store parses it, since any Worker bound to the class can call it.
 */
export const storeCallContextSchema = z.object({
  vertical: verticalIdSchema,
  sessionId: z.string().min(1).max(128),
  actor: z.object({
    actorId: z.string(),
    displayName: z.string().optional(),
    roleId: z.string(),
    permissions: z.array(z.string()).readonly(),
    clientId: z.string().max(512).optional(),
  }),
  correlationId: z.string().min(1).max(128),
  idempotencyKey: idempotencyKeySchema.optional(),
  via: z.enum(["ui", "mcp", "system"]),
  faults: z
    .array(
      z.tuple([
        z.string(),
        z.object({
          code: z.string().optional(),
          latencyMs: z
            .number()
            .int()
            .nonnegative()
            .transform((ms) => Math.min(ms, MAX_STORE_FAULT_LATENCY_MS))
            .optional(),
        }),
      ]),
    )
    .optional(),
  /** The caller's `MOCK_CLOCK=live`, so the store and the caller's in-process reads share one clock. */
  clockLive: z.boolean(),
  /** The caller's catalogue; the store refuses a call from another version instead of misreading it. */
  catalogVersion: z.string(),
});

export type StoreCallContext = z.input<typeof storeCallContextSchema>;

/** The Durable Object's RPC surface, as the callers see it. */
export interface DemoStoreRpc {
  dispatch(capabilityId: string, input: unknown, context: StoreCallContext): Promise<CallResult<unknown>>;
}

let memoized: string | undefined;

/** FNV-1a over the sorted capability ids and their effects: changes whenever the catalogue's shape does. */
export const catalogVersion = (): string => {
  if (memoized !== undefined) return memoized;
  const text = Object.values(CATALOG)
    .map((capability) => `${capability.id}:${capability.effect}`)
    .sort()
    .join("|");
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193) >>> 0;
  memoized = hash.toString(16);
  return memoized;
};
