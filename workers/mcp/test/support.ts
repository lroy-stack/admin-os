import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";

import type { StoreNamespace } from "@/config/durable-adapter.server";

import type { McpWorkerEnv } from "../src/env";
import worker from "../src/index";
import { env } from "cloudflare:workers";

/** The production endpoint: tests address the Worker by the URL clients use. */
export const ENDPOINT = "https://mcp.admin-os.lr0y.dev/mcp";

/** The bindings and vars of the test Worker (test/wrangler.jsonc). */
export const baseEnv = env as unknown as McpWorkerEnv;

/** The Worker's fetch handler, over `baseEnv` with `overrides`: a test's own tokens, read-only switch or store. */
export const fetchWith =
  (overrides: Partial<Record<string, unknown>> = {}) =>
  (input: string | URL | Request, init?: RequestInit): Promise<Response> =>
    worker.fetch(new Request(input, init), { ...baseEnv, ...overrides } as McpWorkerEnv);

const ERAS = {
  legacy: { mode: "legacy" },
  modern: { mode: { pin: "2026-07-28" } },
} as const;

export type Era = keyof typeof ERAS;

/** A real SDK client talking to the Worker through `fetch`, with `token` as its bearer token. */
export const connect = async (
  token: string,
  fetch: (input: string | URL | Request, init?: RequestInit) => Promise<Response>,
  era: Era = "modern",
): Promise<Client> => {
  const client = new Client({ name: "admin-os-worker-test", version: "0.0.0" }, { versionNegotiation: ERAS[era] });
  await client.connect(
    new StreamableHTTPClientTransport(new URL(ENDPOINT), { fetch, authProvider: { token: async () => token } }),
  );
  return client;
};

/** `namespace`, recording the name of every object a call reaches. */
export const recordingStore = (namespace: StoreNamespace) => {
  const names: string[] = [];
  const store: StoreNamespace = {
    idFromName: (name) => {
      names.push(name);
      return namespace.idFromName(name);
    },
    get: (id) => namespace.get(id),
  };
  return { store, names };
};

/** A `tools/list` POST in the 2025 stateless form, one HTTP request with no client in between. */
export const listRequest = (headers: Record<string, string> = {}): RequestInit => ({
  method: "POST",
  headers: {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
    "mcp-protocol-version": "2025-11-25",
    ...headers,
  },
  body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
});

/** `MCP_LIMITER`'s limit in test/wrangler.jsonc. */
export const TEST_RATE_LIMIT = 20;

/** Spends a token's whole rate-limit window, one request after another. */
export const exhaustLimit = async (fetch: (input: string, init?: RequestInit) => Promise<Response>, token: string) => {
  for (let sent = 0; sent < TEST_RATE_LIMIT; sent++) {
    await fetch(ENDPOINT, listRequest({ authorization: `Bearer ${token}` }));
  }
};
