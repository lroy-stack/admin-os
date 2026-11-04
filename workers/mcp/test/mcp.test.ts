import { afterEach, describe, expect, it, vi } from "vitest";

import { demoActor } from "@/config/actor";
import { CATALOG } from "@/config/catalog";
import { demoSessionOf } from "@/config/mcp-auth";
import { MCP_MANIFEST } from "@/config/mcp-manifest";
import { VERTICALS } from "@/config/vertical";
import { exposedCapabilities, TOOL_LIST_CACHE_HINT, toolListVersion, toolNameOf } from "@/core/mcp/server";

import {
  baseEnv,
  connect,
  ENDPOINT,
  type Era,
  exhaustLimit,
  fetchWith,
  listRequest,
  recordingStore,
  TEST_RATE_LIMIT,
} from "./support";
import { exports } from "cloudflare:workers";

/** The Worker as a client reaches it: its default export, under the test Worker's own env. */
const self = (exports as unknown as { default: { fetch: typeof fetch } }).default;
const selfFetch = (input: string | URL | Request, init?: RequestInit) => self.fetch(new Request(input, init));

/** The tools a role is offered on a writable server, by name. */
const toolsOf = (roleId: "owner" | "staff") => {
  const { permissions } = demoActor(roleId, VERTICALS.hospitality);
  return exposedCapabilities(CATALOG, MCP_MANIFEST)
    .filter((capability) => permissions.includes(capability.permission))
    .map((capability) => toolNameOf(capability.id))
    .sort();
};

const ownerReads = (() => {
  const reads = new Set(
    Object.values(CATALOG)
      .filter((capability) => capability.effect === "read")
      .map((capability) => toolNameOf(capability.id)),
  );
  return toolsOf("owner").filter((name) => reads.has(name));
})();

/** Writable tokens of their own, so these tests share no rate-limit bucket with the public tokens. */
const ROLE_TOKENS = "owner-token-0001:owner,staff-token-0001:staff";
const ERAS: readonly Era[] = ["legacy", "modern"];

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
    const response = await fetchWith({ MCP_TOKENS: "origin-token-0001:staff" })(
      "http://localhost:8788/mcp",
      listRequest({ origin: "http://localhost:3000", authorization: "Bearer origin-token-0001" }),
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

const METADATA_URL = "https://mcp.admin-os.lr0y.dev/.well-known/oauth-protected-resource/mcp";

describe("the bearer token", () => {
  it("answers 401 without an Authorization header", async () => {
    expect((await selfFetch(ENDPOINT, listRequest())).status).toBe(401);
  });

  it("answers an unknown token with invalid_token and the protected-resource metadata", async () => {
    const response = await selfFetch(ENDPOINT, listRequest({ authorization: "Bearer token-unknown" }));

    expect([response.status, response.headers.get("www-authenticate")]).toEqual([
      401,
      expect.stringMatching(new RegExp(`^Bearer error="invalid_token", .*resource_metadata="${METADATA_URL}"$`)),
    ]);
  });

  it("serves the protected-resource metadata the challenge names (RFC 9728)", async () => {
    const response = await selfFetch(METADATA_URL);

    expect(await response.json()).toEqual({
      resource: ENDPOINT,
      bearer_methods_supported: ["header"],
      resource_name: "admin-OS",
      resource_documentation: "https://github.com/lroy-stack/admin-os#mcp",
    });
  });

  it("logs a malformed MCP_TOKENS without echoing it, and refuses the call", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await fetchWith({ MCP_TOKENS: "secret-value-without-role" })(
      ENDPOINT,
      listRequest({ authorization: "Bearer secret-value-without-role" }),
    );

    expect([response.status, error.mock.calls.map(([line]) => JSON.parse(String(line)))]).toEqual([
      500,
      [{ event: "mcp.auth.error", message: expect.not.stringContaining("secret-value") }],
    ]);
  });
});

describe("MCP over the Worker, per role and era (moved from /api/mcp)", () => {
  it.each([
    ...ERAS.map((era) => ["owner", "owner-token-0001", era] as const),
    ...ERAS.map((era) => ["staff", "staff-token-0001", era] as const),
  ])("lists the %s tools for its token over the %s era", async (roleId, token, era) => {
    const client = await connect(token, fetchWith({ MCP_TOKENS: ROLE_TOKENS }), era);

    const { tools } = await client.listTools();

    expect([client.getProtocolEra(), tools.map((tool) => tool.name)]).toEqual([era, toolsOf(roleId)]);
  });

  it.each(ERAS)("reports the tool-list version over the %s era", async (era) => {
    const client = await connect("version-token-0001", fetchWith({ MCP_TOKENS: "version-token-0001:staff" }), era);

    expect(client.getServerVersion()?.version).toBe(toolListVersion(CATALOG, MCP_MANIFEST));
  });

  it.each(ERAS)("reads bookings over the %s era", async (era) => {
    const client = await connect("reader-token-0001", fetchWith({ MCP_TOKENS: "reader-token-0001:staff" }), era);
    await client.listTools();

    const result = await client.callTool({ name: "bookings_list", arguments: { limit: 2 } });

    expect(result).toMatchObject({ structuredContent: { items: expect.any(Array) } });
  });

  it("serves /mcp/ with a trailing slash as /mcp", async () => {
    const response = await fetchWith({ MCP_TOKENS: "slash-token-0001:staff" })(
      `${ENDPOINT}/`,
      listRequest({ authorization: "Bearer slash-token-0001" }),
    );

    expect(response.status).toBe(200);
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

    // T3's concise rows: a list never carries a customer's notes.
    expect([result.isError ?? false, names, (result.structuredContent as { items: object[] }).items[0]]).toEqual([
      false,
      [],
      expect.not.objectContaining({ notes: expect.anything() }),
    ]);
  });
});

describe("a writable token (MCP_READ_ONLY=false)", () => {
  it("writes to its own session in the store, and a second call reads it back with its free text marked", async () => {
    const { store, names } = recordingStore(baseEnv.DEMO_STORE);
    const fetch = fetchWith({ MCP_READ_ONLY: "false", MCP_TOKENS: "writer-token-0001:owner", DEMO_STORE: store });
    const writer = await connect("writer-token-0001", fetch);
    await writer.listTools();
    const created = await writer.callTool({
      name: "customers_create",
      arguments: { name: "Grace Hopper", idempotencyKey: "6f1d7f0e-8f7a-4c1e-9b1a-2d3c4e5f6a7b" },
    });
    const id = (created.structuredContent as { id: string }).id;
    await writer.callTool({
      name: "customers_notes_add",
      arguments: { id, text: "Prefers the terrace", idempotencyKey: "0d3b5a1c-6e2f-4a7b-8c9d-1e2f3a4b5c6d" },
    });
    const reader = await connect("writer-token-0001", fetch);
    await reader.listTools();

    const read = await reader.callTool({ name: "customers_get", arguments: { id } });

    expect([read.structuredContent, new Set(names)]).toEqual([
      expect.objectContaining({
        name: "Grace Hopper",
        notes: [expect.objectContaining({ text: { untrusted: true, text: "Prefers the terrace" } })],
      }),
      new Set([`hospitality:${await demoSessionOf("writer-token-0001")}`]),
    ]);
  });
});

describe("rate limit (AC12)", () => {
  it("answers 429 with Retry-After once a token passes its limit", async () => {
    const fetch = fetchWith({ MCP_TOKENS: "limited-token-0001:staff" });
    const allowed = await exhaustLimit(fetch, "limited-token-0001");

    const refused = await fetch(ENDPOINT, listRequest({ authorization: "Bearer limited-token-0001" }));

    expect([allowed, refused.status, refused.headers.get("retry-after"), await refused.json()]).toEqual([
      Array(TEST_RATE_LIMIT).fill(200),
      429,
      "60",
      { jsonrpc: "2.0", id: null, error: { code: -32000, message: expect.stringMatching(/retry after 60 seconds/) } },
    ]);
  });

  it("keys a public demo token by client IP, so one client cannot lock the others out", async () => {
    const fetch = fetchWith();
    const allowed = await exhaustLimit(fetch, "demo-staff-token", { "cf-connecting-ip": "203.0.113.7" });

    const [same, other] = await Promise.all(
      ["203.0.113.7", "203.0.113.8"].map((ip) =>
        fetch(ENDPOINT, listRequest({ authorization: "Bearer demo-staff-token", "cf-connecting-ip": ip })),
      ),
    );

    expect([allowed, same?.status, other?.status]).toEqual([Array(TEST_RATE_LIMIT).fill(200), 429, 200]);
  });

  it("answers a JSON-RPC 503 with CORS headers when the limiter fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const failing = { limit: async () => Promise.reject(new Error("limiter down")) };

    const response = await fetchWith({ MCP_TOKENS: "broken-token-0001:staff", MCP_LIMITER: failing })(
      ENDPOINT,
      listRequest({ authorization: "Bearer broken-token-0001", origin: "https://claude.ai" }),
    );

    expect([response.status, response.headers.get("access-control-allow-origin"), await response.json()]).toEqual([
      503,
      "https://claude.ai",
      { jsonrpc: "2.0", id: null, error: { code: -32000, message: expect.stringMatching(/rate limiter/) } },
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

describe("the surface over HTTP (moved from /api/mcp)", () => {
  it.each([
    ["a non-bearer scheme", {}, "Basic dG9rZW4tb3duZXI="],
    ["a demo token when another adapter is configured", { DATA_ADAPTER: "supabase" }, "Bearer demo-owner-token"],
  ])("answers 401 to %s", async (_case, overrides, authorization) => {
    expect((await fetchWith(overrides)(ENDPOINT, listRequest({ authorization }))).status).toBe(401);
  });

  it("carries the tool-list cache hint over the modern era (spec 004 D8)", async () => {
    const client = await connect("hint-token-0001", fetchWith({ MCP_TOKENS: "hint-token-0001:staff" }));

    const listed = await client.listTools();

    expect([listed.ttlMs, listed.cacheScope]).toEqual([TOOL_LIST_CACHE_HINT.ttlMs, TOOL_LIST_CACHE_HINT.cacheScope]);
  });

  it.each([
    ["bookings_cancel", "staff-token-0002"],
    ["no_such_tool", "staff-token-0003"],
  ])("answers %s, which staff is not offered, with access.forbidden", async (name, token) => {
    const client = await connect(token, fetchWith({ MCP_TOKENS: `${token}:staff` }));
    await client.listTools();

    const result = await client.callTool({ name, arguments: {} });

    expect(result).toMatchObject({ isError: true, structuredContent: { code: "access.forbidden" } });
  });

  it("refuses a write with the public demo tokens and says the server is read-only", async () => {
    const client = await connect("demo-manager-token", selfFetch);
    await client.listTools();

    const result = await client.callTool({ name: "customers_contact_update", arguments: { id: "C-1", name: "Ada" } });

    expect(result).toMatchObject({
      isError: true,
      structuredContent: { code: "access.forbidden", message: expect.stringMatching(/read-only/) },
    });
  });

  it("applies MOCK_FAULTS as the UI does", async () => {
    const fetch = fetchWith({ MCP_TOKENS: "fault-token-0001:owner", MOCK_FAULTS: "bookings.list=bookings.not_found" });
    const client = await connect("fault-token-0001", fetch);
    await client.listTools();

    const result = await client.callTool({ name: "bookings_list", arguments: {} });

    expect(result).toMatchObject({ isError: true, structuredContent: { code: "bookings.not_found" } });
  });
});
