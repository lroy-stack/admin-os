import { afterEach, describe, expect, it, vi } from "vitest";

import { demoActor } from "@/config/actor";
import { CATALOG } from "@/config/catalog";
import { MCP_MANIFEST } from "@/config/mcp-manifest";
import { VERTICALS } from "@/config/vertical";
import type { RoleId } from "@/core/access";
import { exposedCapabilities, toolNameOf } from "@/core/mcp/server";

import {
  authorize,
  authorizeUrl,
  browserAt,
  demoCookies,
  ISSUER,
  openConsent,
  openGrants,
  pkce,
  registeredClientId,
  revokeOnPage,
  toolCallRequest,
  webClient,
} from "./oauth-support";
import { connect, ENDPOINT, fetchWith, SETTINGS_CHANGE } from "./support";

/** The test Worker with the deployed defaults: `MCP_READ_ONLY` unset, the public demo tokens in force. */
const fetch = fetchWith();

/** The tools a role is offered, by name: its reads only, or everything it holds. */
const toolsOf = (roleId: RoleId, effects: "reads" | "all") => {
  const { permissions } = demoActor(roleId, VERTICALS.hospitality);
  return exposedCapabilities(CATALOG, MCP_MANIFEST)
    .filter((capability) => permissions.includes(capability.permission))
    .filter((capability) => effects === "all" || capability.effect === "read")
    .map((capability) => toolNameOf(capability.id))
    .sort();
};

const CHALLENGE = `Bearer realm="OAuth", error="insufficient_scope", scope="read write", resource_metadata="${ISSUER}/.well-known/oauth-protected-resource/mcp"`;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("a read grant (AC2)", () => {
  it("lists only read tools", async () => {
    const browser = browserAt("192.0.2.1", await demoCookies(crypto.randomUUID(), "owner"));
    const { accessToken } = await authorize(fetch, browser, await registeredClientId(fetch, browser.ip));
    const client = await connect(accessToken, fetch);

    const { tools } = await client.listTools();

    expect(tools.map((tool) => tool.name)).toEqual(toolsOf("owner", "reads"));
  });

  it("answers a write the role holds with 403 insufficient_scope for read and write", async () => {
    const browser = browserAt("192.0.2.2", await demoCookies(crypto.randomUUID(), "owner"));
    const { accessToken } = await authorize(fetch, browser, await registeredClientId(fetch, browser.ip));

    const response = await fetch(ENDPOINT, toolCallRequest(accessToken, "settings_values_update", SETTINGS_CHANGE));

    expect([response.status, response.headers.get("www-authenticate"), await response.json()]).toEqual([
      403,
      CHALLENGE,
      { error: "insufficient_scope" },
    ]);
  });

  it("logs the challenged call as one refused line with the grant's client (AC12)", async () => {
    const browser = browserAt("192.0.2.6", await demoCookies(crypto.randomUUID(), "owner"));
    const clientId = await registeredClientId(fetch, browser.ip);
    const { accessToken } = await authorize(fetch, browser, clientId);
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await fetch(ENDPOINT, toolCallRequest(accessToken, "settings_values_update", SETTINGS_CHANGE));

    expect(log.mock.calls.map(([line]) => JSON.parse(String(line)))).toEqual([
      {
        event: "mcp.call",
        correlationId: expect.any(String),
        clientId,
        tool: "settings_values_update",
        status: "refused",
        code: "insufficient_scope",
        via: "mcp-worker",
      },
    ]);
  });

  it("answers a write the role lacks with access.forbidden, since no consent can grant it", async () => {
    const browser = browserAt("192.0.2.3", await demoCookies(crypto.randomUUID(), "staff"));
    const { accessToken } = await authorize(fetch, browser, await registeredClientId(fetch, browser.ip));
    const client = await connect(accessToken, fetch);
    await client.listTools();

    const result = await client.callTool({ name: "settings_values_update", arguments: SETTINGS_CHANGE });

    expect(result).toMatchObject({ isError: true, structuredContent: { code: "access.forbidden" } });
  });

  it("is what a person grants by default, even when the client asks for write", async () => {
    const browser = browserAt("192.0.2.4", await demoCookies(crypto.randomUUID()));

    const granted = await authorize(fetch, browser, await registeredClientId(fetch, browser.ip), "read write", "allow");

    expect(granted.scope).toBe("read");
  });

  it("never becomes write from the form when the client asked for read only", async () => {
    const browser = browserAt("192.0.2.5", await demoCookies(crypto.randomUUID()));

    const granted = await authorize(fetch, browser, await registeredClientId(fetch, browser.ip), "read", "allow_write");

    expect(granted.scope).toBe("read");
  });
});

describe("the write consent", () => {
  it("is its own section with its own button when the client asks for write", async () => {
    const browser = browserAt("192.0.2.10", await demoCookies(crypto.randomUUID()));
    const clientId = await registeredClientId(fetch, browser.ip);
    const { challenge } = await pkce();

    const { html } = await openConsent(fetch, browser, authorizeUrl(clientId, "read write", challenge));

    expect(html).toMatch(
      /<h2>Change<\/h2>[\s\S]*class="warning">This app also asks to change data[\s\S]*value="allow">Allow reading only<\/button><button name="decision" value="allow_write">Allow reading and changes<\/button>/,
    );
  });

  it("is not offered when the client asks for read", async () => {
    const browser = browserAt("192.0.2.11", await demoCookies(crypto.randomUUID()));
    const clientId = await registeredClientId(fetch, browser.ip);
    const { challenge } = await pkce();

    const { html } = await openConsent(fetch, browser, authorizeUrl(clientId, "read", challenge));

    expect([html.includes("allow_write"), html.includes("<h2>Change</h2>")]).toEqual([false, false]);
  });
});

describe("step-up (AC3)", () => {
  it("lets the same client write after the write consent, into the visitor's session the web app reads", async () => {
    const session = crypto.randomUUID();
    const browser = browserAt("192.0.2.20", await demoCookies(session, "owner"));
    const clientId = await registeredClientId(fetch, browser.ip);
    const read = await authorize(fetch, browser, clientId);
    const refused = await fetch(ENDPOINT, toolCallRequest(read.accessToken, "settings_values_update", SETTINGS_CHANGE));
    const write = await authorize(fetch, browser, clientId, "read write", "allow_write");
    const agent = await connect(write.accessToken, fetch);
    await agent.listTools();

    const held = await agent.callTool({ name: "settings_values_update", arguments: SETTINGS_CHANGE });
    const { approvalId } = held.structuredContent as { approvalId: string };

    expect([refused.status, write.scope, await webClient(session).call("approvals.get", { approvalId })]).toEqual([
      403,
      "read write",
      { ok: true, value: expect.objectContaining({ approvalId, status: "pending" }) },
    ]);
  });

  it("lists the role's writes once write is granted", async () => {
    const browser = browserAt("192.0.2.21", await demoCookies(crypto.randomUUID(), "manager"));
    const clientId = await registeredClientId(fetch, browser.ip);
    const { accessToken } = await authorize(fetch, browser, clientId, "read write", "allow_write");
    const client = await connect(accessToken, fetch);

    const { tools } = await client.listTools();

    expect(tools.map((tool) => tool.name)).toEqual(toolsOf("manager", "all"));
  });
});

describe("MCP_READ_ONLY with grants", () => {
  it("lists no write even for a write grant, and answers a write with the read-only refusal, never a challenge", async () => {
    const readOnly = fetchWith({ MCP_READ_ONLY: "true" });
    const browser = browserAt("192.0.2.30", await demoCookies(crypto.randomUUID(), "owner"));
    const clientId = await registeredClientId(readOnly, browser.ip);
    const { accessToken } = await authorize(readOnly, browser, clientId, "read write", "allow_write");
    const client = await connect(accessToken, readOnly);

    const { tools } = await client.listTools();
    const result = await client.callTool({ name: "settings_values_update", arguments: SETTINGS_CHANGE });

    expect([tools.map((tool) => tool.name), result]).toMatchObject([
      toolsOf("owner", "reads"),
      { isError: true, structuredContent: { code: "access.forbidden", message: expect.stringMatching(/read-only/) } },
    ]);
  });
});

describe("the grants page (/grants)", () => {
  it("lists this browser's grants with their client and scope, and no other browser's", async () => {
    const browser = browserAt("192.0.2.40", await demoCookies(crypto.randomUUID()));
    const stranger = browserAt("192.0.2.41", await demoCookies(crypto.randomUUID()));
    await authorize(
      fetch,
      browser,
      await registeredClientId(fetch, browser.ip, "Claude Code"),
      "read write",
      "allow_write",
    );
    await authorize(fetch, stranger, await registeredClientId(fetch, stranger.ip, "Stranger Agent"));

    const { html, grantIds } = await openGrants(fetch, browser);

    expect([grantIds.length, html]).toEqual([
      1,
      expect.stringMatching(/<strong>Claude Code<\/strong>[\s\S]*Read and change · Connected/),
    ]);
  });

  it("shows no grant to a visitor without a session", async () => {
    const { html, grantIds } = await openGrants(fetch, browserAt("192.0.2.42"));

    expect([grantIds, html]).toEqual([[], expect.stringContaining("No app has access")]);
  });

  it("is never framed and posts its form with a real Origin", async () => {
    const { response } = await openGrants(fetch, browserAt("192.0.2.46"));

    expect([
      response.headers.get("referrer-policy"),
      response.headers.get("content-security-policy"),
      response.headers.get("x-frame-options"),
    ]).toEqual(["same-origin", expect.stringContaining("frame-ancestors 'none'"), "DENY"]);
  });

  it.each([
    ["the opaque null Origin", "null"],
    ["another allowed origin of the Worker", "https://claude.ai"],
  ])("refuses a revoke posted with %s", async (_case, origin) => {
    const response = await fetch(`${ISSUER}/grants`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", origin, "cf-connecting-ip": "192.0.2.47" },
      body: "grantId=anything",
    });

    expect(response.status).toBe(403);
  });

  it("revokes a grant, after which its token answers 401", async () => {
    const browser = browserAt("192.0.2.43", await demoCookies(crypto.randomUUID()));
    const { accessToken } = await authorize(fetch, browser, await registeredClientId(fetch, browser.ip));
    const { grantIds } = await openGrants(fetch, browser);

    const revoked = await revokeOnPage(fetch, browser, grantIds[0] ?? "");
    const after = await fetch(ENDPOINT, toolCallRequest(accessToken, "access_me_get"));

    expect([
      revoked.status,
      revoked.headers.get("location"),
      after.status,
      (await openGrants(fetch, browser)).grantIds,
    ]).toEqual([303, "/grants?revoked", 401, []]);
  });

  it("never revokes another browser's grant", async () => {
    const owner = browserAt("192.0.2.44", await demoCookies(crypto.randomUUID()));
    const { accessToken } = await authorize(fetch, owner, await registeredClientId(fetch, owner.ip));
    const { grantIds } = await openGrants(fetch, owner);

    await revokeOnPage(fetch, browserAt("192.0.2.45", await demoCookies(crypto.randomUUID())), grantIds[0] ?? "");

    expect((await fetch(ENDPOINT, toolCallRequest(accessToken, "access_me_get"))).status).toBe(200);
  });
});
