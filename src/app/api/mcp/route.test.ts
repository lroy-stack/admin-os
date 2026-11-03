import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { demoActor } from "@/config/actor";
import { CATALOG } from "@/config/catalog";
import { VERTICALS } from "@/config/vertical";
import { toolNameOf } from "@/core/mcp/server";

import { GET as metadata } from "../../.well-known/oauth-protected-resource/api/mcp/route";
import { DELETE, GET, POST } from "./route";

const ORIGIN = "http://localhost:3410";
const ENDPOINT = `${ORIGIN}/api/mcp`;
const METADATA_URL = `${ORIGIN}/.well-known/oauth-protected-resource/api/mcp`;
const TOKENS = "token-owner:owner,token-staff:staff";

const routes = { GET, POST, DELETE } as const;
type Method = keyof typeof routes;

/** The route handlers behind a fetch, so a real SDK client talks to them without a server. */
const routeFetch = async (url: string | URL, init?: RequestInit): Promise<Response> => {
  const request = new Request(url, init);
  return routes[request.method as Method](request);
};

const quiet = vi.spyOn(console, "info").mockImplementation(() => undefined);

const toolsOf = (roleId: "owner" | "staff") => {
  const { permissions } = demoActor(roleId, VERTICALS.hospitality);
  return Object.values(CATALOG)
    .filter((capability) => permissions.includes(capability.permission))
    .map((capability) => toolNameOf(capability.id));
};

const ERAS = [
  ["legacy", { mode: "legacy" }],
  ["modern", { mode: { pin: "2026-07-28" } }],
] as const;

const open: Client[] = [];

const connect = async (token: string, versionNegotiation: (typeof ERAS)[number][1] = ERAS[0][1]) => {
  const client = new Client({ name: "admin-os-route-test", version: "0.0.0" }, { versionNegotiation });
  const transport = new StreamableHTTPClientTransport(new URL(ENDPOINT), {
    fetch: routeFetch,
    authProvider: { token: async () => token },
  });
  await client.connect(transport);
  open.push(client);
  return client;
};

beforeEach(() => {
  vi.stubEnv("MCP_TOKENS", TOKENS);
  vi.stubEnv("MOCK_FAULTS", "");
});

afterEach(async () => {
  await Promise.all(open.splice(0).map((client) => client.close()));
  vi.unstubAllEnvs();
  quiet.mockClear();
});

const post = (headers: Record<string, string>) =>
  POST(
    new Request(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json, text/event-stream", ...headers },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    }),
  );

describe("POST /api/mcp without a valid token (ADR 0009)", () => {
  it.each([
    ["no Authorization header", {}],
    ["an unknown token", { authorization: "Bearer token-unknown" }],
    ["a non-bearer scheme", { authorization: "Basic dG9rZW4tb3duZXI=" }],
  ])("answers 401 for %s", async (_case, headers) => {
    expect((await post(headers)).status).toBe(401);
  });

  it("names the protected-resource metadata in WWW-Authenticate", async () => {
    const response = await post({ authorization: "Bearer token-unknown" });
    expect(response.headers.get("www-authenticate")).toMatch(
      new RegExp(`^Bearer error="invalid_token", .*resource_metadata="${METADATA_URL}"$`),
    );
  });

  it("refuses the demo tokens when another adapter is configured without MCP_TOKENS", async () => {
    vi.stubEnv("MCP_TOKENS", "");
    vi.stubEnv("DATA_ADAPTER", "supabase");
    expect((await post({ authorization: "Bearer demo-owner-token" })).status).toBe(401);
  });

  it("accepts the documented demo token on the mock adapter when MCP_TOKENS is unset", async () => {
    vi.stubEnv("MCP_TOKENS", "");
    expect((await post({ authorization: "Bearer demo-owner-token" })).status).toBe(200);
  });
});

describe("GET /.well-known/oauth-protected-resource/api/mcp (RFC 9728)", () => {
  it("describes /api/mcp as a bearer-protected resource", async () => {
    const response = metadata(new Request(METADATA_URL));
    expect(await response.json()).toEqual({
      resource: ENDPOINT,
      bearer_methods_supported: ["header"],
      resource_name: "admin-OS",
      resource_documentation: "https://github.com/lroy-stack/admin-os#mcp",
    });
  });
});

describe("MCP over the route (AC5)", () => {
  it.each([
    ...ERAS.map(([era, negotiation]) => ["owner", "token-owner", era, negotiation] as const),
    ...ERAS.map(([era, negotiation]) => ["staff", "token-staff", era, negotiation] as const),
  ])("lists the %s tools for its token over the %s era", async (roleId, token, era, negotiation) => {
    const client = await connect(token, negotiation);
    const { tools } = await client.listTools();
    expect([client.getProtocolEra(), tools.map((tool) => tool.name)]).toEqual([era, toolsOf(roleId)]);
  });

  it.each(ERAS)("reads bookings over the %s era", async (_era, negotiation) => {
    const client = await connect("token-staff", negotiation);
    await client.listTools();
    const result = await client.callTool({ name: "bookings_list", arguments: { limit: 2 } });
    expect(result).toMatchObject({ structuredContent: { items: expect.any(Array) } });
  });

  it.each(["bookings_cancel", "no_such_tool"])(
    "answers %s, which staff was not offered, with access.forbidden",
    async (name) => {
      const client = await connect("token-staff");
      await client.listTools();
      const result = await client.callTool({ name, arguments: {} });
      expect(result).toMatchObject({ isError: true, structuredContent: { code: "access.forbidden" } });
    },
  );

  it("applies MOCK_FAULTS as the UI does", async () => {
    vi.stubEnv("MOCK_FAULTS", "bookings.list=bookings.not_found");
    const client = await connect("token-owner");
    await client.listTools();
    const result = await client.callTool({ name: "bookings_list", arguments: {} });
    expect(result).toMatchObject({ isError: true, structuredContent: { code: "bookings.not_found" } });
  });
});
