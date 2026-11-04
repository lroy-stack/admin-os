import type { OAuthHelpers } from "@cloudflare/workers-oauth-provider";
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
  /** Requests to `/mcp`, per grant, or per token and client IP for the public demo tokens. */
  readonly MCP_LIMITER: RateLimit;
  /** `/authorize` and `/register` (no bearer) and new demo sessions, per client IP: tight, they write KV. */
  readonly OAUTH_LIMITER: RateLimit;
  /** `/token` and `/mcp` per client IP before the provider reads KV: wide, a hosted client shares a few IPs. */
  readonly EDGE_LIMITER: RateLimit;
  /** `workers-oauth-provider`'s clients, grants and tokens (tokens and secrets by hash, props encrypted). */
  readonly OAUTH_KV: KVNamespace;
  /** The provider's helpers; `OAuthProvider` sets them on the env before any handler of this Worker runs. */
  readonly OAUTH_PROVIDER: OAuthHelpers;
  /**
   * `vars` and secrets: `DATA_STORE`, `DEMO_SESSION_SECRET`, `DEMO_COOKIE_DOMAIN`, `MCP_RATE_LIMIT_PERIOD_S`,
   * `VERTICAL`, `MCP_TOKENS`, `MCP_READ_ONLY`, `MOCK_CLOCK`, `MOCK_FAULTS`.
   */
  readonly [variable: string]: unknown;
}

/** The string variables of the Worker's env, the shape the composition root reads (bindings are left out). */
export const variablesOf = (env: McpWorkerEnv): McpEnv =>
  Object.fromEntries(Object.entries(env).filter((entry): entry is [string, string] => typeof entry[1] === "string"));

/** The two windows the Workers rate-limit binding allows, in seconds. */
const periodSchema = z.enum(["10", "60"]);

/**
 * `MCP_RATE_LIMIT_PERIOD_S`: the `period` of `MCP_LIMITER`, `OAUTH_LIMITER` and `EDGE_LIMITER`, set beside them in wrangler.jsonc, so
 * `Retry-After` tells a refused client the window the bindings really use. A missing or other value fails loudly.
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
