import { z } from "zod";

import type { StoreNamespace } from "@/config/durable-adapter.server";
import type { McpEnv } from "@/config/mcp.server";

/**
 * The MCP Worker's bindings, as `wrangler.jsonc` declares them. Written by hand: `wrangler types` emits one global
 * `Cloudflare.Env` per run, and a second run for this Worker collides with the store's (workers/worker-configuration.d.ts).
 */
export interface McpWorkerEnv {
  /** The store Worker's `DemoStore`, bound by `script_name`; only a writable caller's session reaches it. */
  readonly DEMO_STORE: StoreNamespace;
  /** Requests to `/mcp`, per token (per grant once OAuth lands). */
  readonly MCP_LIMITER: RateLimit;
  /**
   * `vars` and secrets: `DATA_STORE`, `MCP_RATE_LIMIT_PERIOD_S`, `VERTICAL`, `MCP_TOKENS`, `MCP_READ_ONLY`,
   * `MOCK_CLOCK`, `MOCK_FAULTS`.
   */
  readonly [variable: string]: unknown;
}

/** The string variables of the Worker's env, the shape the composition root reads (bindings are left out). */
export const variablesOf = (env: McpWorkerEnv): McpEnv =>
  Object.fromEntries(Object.entries(env).filter((entry): entry is [string, string] => typeof entry[1] === "string"));

/** The two windows the Workers rate-limit binding allows, in seconds. */
const periodSchema = z.enum(["10", "60"]);

/**
 * `MCP_RATE_LIMIT_PERIOD_S`: the `period` of `MCP_LIMITER`, set beside it in wrangler.jsonc, so `Retry-After` tells a
 * refused client the window the binding really uses. A missing or other value fails loudly.
 */
export const rateLimitPeriodOf = (variables: McpEnv): number => {
  const parsed = periodSchema.safeParse(variables.MCP_RATE_LIMIT_PERIOD_S);
  if (!parsed.success) {
    throw new Error(
      `MCP_RATE_LIMIT_PERIOD_S must be "10" or "60", the period of MCP_LIMITER in wrangler.jsonc; got "${String(variables.MCP_RATE_LIMIT_PERIOD_S)}".`,
    );
  }
  return Number(parsed.data);
};
