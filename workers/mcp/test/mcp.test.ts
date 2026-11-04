import { afterEach, describe, expect, it, vi } from "vitest";

import { demoActor } from "@/config/actor";
import { CATALOG } from "@/config/catalog";
import { demoSessionOf } from "@/config/mcp-auth";
import { MCP_MANIFEST } from "@/config/mcp-manifest";
import { VERTICALS } from "@/config/vertical";
import { exposedCapabilities, toolListVersion, toolNameOf } from "@/core/mcp/server";

import { baseEnv, connect, ENDPOINT, type Era, exhaustLimit, fetchWith, listRequest, recordingStore } from "./support";
import { exports } from "cloudflare:workers";

/** The Worker as a client reaches it: its default export, under the test Worker's own env. */
const self = (exports as unknown as { default: { fetch: typeof fetch } }).default;
const selfFetch = (input: string | URL | Request, init?: RequestInit) => self.fetch(new Request(input, init));

const ownerReads = (() => {
  const { permissions } = demoActor("owner", VERTICALS.hospitality);
  return exposedCapabilities(CATALOG, MCP_MANIFEST)
    .filter((capability) => capability.effect === "read" && permissions.includes(capability.permission))
    .map((capability) => toolNameOf(capability.id))
    .sort();
})();

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET / (health)", () => {
  it("names the server, its tool-list version and the MCP URL", async () => {
    const response = await selfFetch("https://mcp.admin-os.lr0y.dev/");

    expect(await response.json()).toEqual({
      name: "admin-os",
      version: toolListVersion(CATALOG, MCP_MANIFEST, true),
      mcp: ENDPOINT,
    });
  });
});

describe("Origin (AC12)", () => {
  it.each([
    ["POST /mcp", ENDPOINT, listRequest({ origin: "https://evil.example", authorization: "Bearer demo-owner-token" })],
    ["GET /", "https://mcp.admin-os.lr0y.dev/", { headers: { origin: "https://evil.example" } }],
    ["a preflight", ENDPOINT, { method: "OPTIONS", headers: { origin: "https://evil.example" } }],
    ["the null origin", ENDPOINT, listRequest({ origin: "null", authorization: "Bearer demo-owner-token" })],
    ["a localhost page in production", ENDPOINT, listRequest({ origin: "http://localhost:3000" })],
  ])("answers 403 to a foreign Origin on %s", async (_case, url, init) => {
    expect((await selfFetch(url, init)).status).toBe(403);
  });

  it("lets a localhost page call the Worker while it runs on localhost (wrangler dev)", async () => {
    const response = await selfFetch(
      "http://localhost:8788/mcp",
      listRequest({ origin: "http://localhost:3000", authorization: "Bearer demo-owner-token" }),
    );

    expect([response.status, response.headers.get("access-control-allow-origin")]).toEqual([
      200,
      "http://localhost:3000",
    ]);
  });
});

describe("CORS", () => {
  it("answers the preflight of an allowed origin with the MCP headers", async () => {
    const response = await selfFetch(ENDPOINT, {
      method: "OPTIONS",
      headers: {
        origin: "https://claude.ai",
        "access-control-request-method": "POST",
        "access-control-request-headers": "authorization, content-type, mcp-protocol-version",
      },
    });

    expect([
      response.status,
      response.headers.get("access-control-allow-origin"),
      response.headers.get("access-control-allow-methods"),
      response.headers.get("access-control-allow-headers"),
      response.headers.get("access-control-expose-headers"),
    ]).toEqual([
      204,
      "https://claude.ai",
      "GET, POST, DELETE, OPTIONS",
      "Authorization, Content-Type, MCP-Protocol-Version, Mcp-Method, Mcp-Name",
      "WWW-Authenticate, Mcp-Protocol-Version, Retry-After",
    ]);
  });

  it("lets a browser on the web app read the 401 challenge", async () => {
    const response = await selfFetch(ENDPOINT, listRequest({ origin: "https://admin-os.lr0y.dev" }));

    expect([
      response.status,
      response.headers.get("access-control-allow-origin"),
      response.headers.get("access-control-expose-headers"),
      response.headers.get("www-authenticate"),
    ]).toEqual([
      401,
      "https://admin-os.lr0y.dev",
      "WWW-Authenticate, Mcp-Protocol-Version, Retry-After",
      expect.stringContaining(
        'resource_metadata="https://mcp.admin-os.lr0y.dev/.well-known/oauth-protected-resource/mcp"',
      ),
    ]);
  });
});

describe("the bearer token", () => {
  it.each([
    ["no Authorization header", {}],
    ["an unknown token", { authorization: "Bearer token-unknown" }],
  ])("answers 401 for %s", async (_case, headers) => {
    expect((await selfFetch(ENDPOINT, listRequest(headers))).status).toBe(401);
  });

  it("serves the protected-resource metadata the challenge names", async () => {
    const response = await selfFetch("https://mcp.admin-os.lr0y.dev/.well-known/oauth-protected-resource/mcp");

    expect(await response.json()).toMatchObject({ resource: ENDPOINT, bearer_methods_supported: ["header"] });
  });
});

describe("tools/list with a public demo token (AC12)", () => {
  it.each<Era>(["legacy", "modern"])("lists the owner's read tools only over the %s era", async (era) => {
    const client = await connect("demo-owner-token", selfFetch, era);

    const { tools } = await client.listTools();

    expect(tools.map((tool) => tool.name)).toEqual(ownerReads);
  });

  it("never reaches the store: a read-only server serves the seed in process", async () => {
    const { store, names } = recordingStore(baseEnv.DEMO_STORE);
    const client = await connect("demo-owner-token", fetchWith({ DEMO_STORE: store }));

    await client.listTools();
    const result = await client.callTool({ name: "customers_list", arguments: { limit: 2 } });

    expect([result.isError ?? false, names]).toEqual([false, []]);
  });
});

describe("a writable token (MCP_READ_ONLY=false)", () => {
  it("writes to its own session in the store, and a second call reads it back", async () => {
    const { store, names } = recordingStore(baseEnv.DEMO_STORE);
    const fetch = fetchWith({ MCP_READ_ONLY: "false", MCP_TOKENS: "writer-token-0001:owner", DEMO_STORE: store });
    const writer = await connect("writer-token-0001", fetch);
    await writer.listTools();
    const created = await writer.callTool({
      name: "customers_create",
      arguments: { name: "Grace Hopper", idempotencyKey: "6f1d7f0e-8f7a-4c1e-9b1a-2d3c4e5f6a7b" },
    });
    const reader = await connect("writer-token-0001", fetch);
    await reader.listTools();

    const read = await reader.callTool({
      name: "customers_get",
      arguments: { id: (created.structuredContent as { id: string }).id },
    });

    expect([read.structuredContent, new Set(names)]).toEqual([
      expect.objectContaining({ name: "Grace Hopper" }),
      new Set([`hospitality:${await demoSessionOf("writer-token-0001")}`]),
    ]);
  });
});

describe("rate limit (AC12)", () => {
  it("answers 429 with Retry-After once a token passes its limit", async () => {
    const fetch = fetchWith({ MCP_TOKENS: "limited-token-0001:staff" });
    await exhaustLimit(fetch, "limited-token-0001");

    const refused = await fetch(ENDPOINT, listRequest({ authorization: "Bearer limited-token-0001" }));

    expect([refused.status, refused.headers.get("retry-after"), await refused.json()]).toEqual([
      429,
      "60",
      { jsonrpc: "2.0", id: null, error: { code: -32000, message: expect.stringMatching(/retry after 60 seconds/) } },
    ]);
  });
});

describe("logs (AC12)", () => {
  it("writes one structured line per tool call, without arguments or tokens", async () => {
    const fetch = fetchWith({ MCP_TOKENS: "logged-token-0001:manager" });
    const client = await connect("logged-token-0001", fetch);
    await client.listTools();
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    const result = await client.callTool({ name: "bookings_list", arguments: { limit: 1 } });

    expect(log.mock.calls.map(([line]) => JSON.parse(String(line)))).toEqual([
      {
        event: "mcp.call",
        correlationId: result._meta?.["admin-os/correlationId"],
        clientId: "demo-manager",
        tool: "bookings_list",
        status: "ok",
        durationMs: expect.any(Number),
        via: "mcp-worker",
      },
    ]);
  });
});
