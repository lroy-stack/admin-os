import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DEMO_ROLE_COOKIE,
  DEMO_SESSION_COOKIE,
  DEMO_SESSION_MAX_AGE_S,
  verifyDemoSession,
} from "@/config/demo-session";

import { variablesOf } from "../src/env";
import {
  answerConsent,
  authorize,
  authorizeUrl,
  browserAt,
  demoCookies,
  exchangeCode,
  ISSUER,
  openConsent,
  pkce,
  REDIRECT_URI,
  register,
  registeredClientId,
  signedSession,
  spend,
  webClient,
} from "./oauth-support";
import { baseEnv, connect, ENDPOINT, fetchWith, recordingStore, TEST_RATE_LIMIT } from "./support";

/** The test Worker as clients reach it; writes stay off unless a test lifts `MCP_READ_ONLY`. */
const fetch = fetchWith();
const writable = (overrides: Record<string, unknown> = {}) => fetchWith({ MCP_READ_ONLY: "false", ...overrides });

const VISITOR = "6f1c2a9e-3b0d-4c1e-8f6a-1d2e3f4a5b6c";
/** A seeded hospitality booking that can still be cancelled (as in src/config/approvals.test.ts). */
const CONFIRMED_BOOKING = "R-1046";

/** The session id a response's `demo_sid` cookie carries, verified with the Worker's own secret. */
const sessionOfResponse = async (response: Response): Promise<string | undefined> => {
  const line = response.headers.getSetCookie().find((cookie) => cookie.startsWith(`${DEMO_SESSION_COOKIE}=`)) ?? "";
  const value = decodeURIComponent(line.slice(DEMO_SESSION_COOKIE.length + 1).split(";")[0] ?? "");
  return verifyDemoSession(value, Date.now(), variablesOf(baseEnv));
};

/** A limiter that refuses only the keys `refuses` matches, and records every key it was asked about. */
const limiterRefusing = (refuses: RegExp) => {
  const keys: string[] = [];
  return {
    keys,
    limiter: {
      limit: async ({ key }: { key: string }) => {
        keys.push(key);
        return { success: !refuses.test(key) };
      },
    },
  };
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("discovery (MCP authorization 2026-07-28)", () => {
  it("names this Worker as the authorization server and read as the scope to ask for first", async () => {
    const response = await fetch(`${ISSUER}/.well-known/oauth-protected-resource/mcp`);

    expect(await response.json()).toEqual({
      resource: ENDPOINT,
      authorization_servers: [ISSUER],
      scopes_supported: ["read"],
      bearer_methods_supported: ["header"],
      resource_name: "admin-OS",
    });
  });

  it("advertises the consent page, the token endpoint, DCR, CIMD and both scopes", async () => {
    const response = await fetch(`${ISSUER}/.well-known/oauth-authorization-server`);

    expect(await response.json()).toMatchObject({
      issuer: ISSUER,
      authorization_endpoint: `${ISSUER}/authorize`,
      token_endpoint: `${ISSUER}/token`,
      registration_endpoint: `${ISSUER}/register`,
      scopes_supported: ["read", "write"],
      client_id_metadata_document_supported: true,
      code_challenge_methods_supported: ["S256"],
    });
  });

  it("challenges a request without a token with the metadata and the read scope", async () => {
    const response = await fetch(ENDPOINT, { method: "POST" });

    expect([response.status, response.headers.get("www-authenticate")]).toEqual([
      401,
      `Bearer realm="OAuth", resource_metadata="${ISSUER}/.well-known/oauth-protected-resource/mcp", scope="read"`,
    ]);
  });
});

describe("the consent page (/authorize)", () => {
  it("says which client asks, where access goes, the visitor's role and what read means", async () => {
    const browser = browserAt("198.51.100.1", await demoCookies(VISITOR, "manager"));
    const clientId = await registeredClientId(fetch, browser.ip, "Claude Code");
    const { challenge } = await pkce();

    const { response, html } = await openConsent(fetch, browser, authorizeUrl(clientId, "read", challenge));

    expect([response.status, html]).toEqual([
      200,
      expect.stringMatching(
        /<strong>Claude Code<\/strong>[\s\S]*not verified[\s\S]*<strong>127\.0\.0\.1<\/strong>[\s\S]*an app on your computer[\s\S]*acts as Manager[\s\S]*cannot change anything/,
      ),
    ]);
  });

  it("renders the page in the visitor's locale", async () => {
    const browser = browserAt("198.51.100.2", await demoCookies(VISITOR));
    const clientId = await registeredClientId(fetch, browser.ip);
    const { challenge } = await pkce();

    const response = await fetch(authorizeUrl(clientId, "read", challenge), {
      headers: { "accept-language": "es-ES,es;q=0.9", "cf-connecting-ip": browser.ip },
    });

    expect(await response.text()).toMatch(/<html lang="es">[\s\S]*Permitir[\s\S]*Denegar/);
  });

  it("escapes what the client chose to be called", async () => {
    const browser = browserAt("198.51.100.3", await demoCookies(VISITOR));
    const clientId = await registeredClientId(fetch, browser.ip, '<img src=x onerror="alert(1)">');
    const { challenge } = await pkce();

    const { html } = await openConsent(fetch, browser, authorizeUrl(clientId, "read", challenge));

    expect([html.includes("<img"), html.includes("&#60;img src=x onerror=&#34;alert(1)&#34;&#62;")]).toEqual([
      false,
      true,
    ]);
  });

  it("keeps the visitor's signed session and renews its cookie for the web app's domain", async () => {
    const browser = browserAt("198.51.100.4", await demoCookies(VISITOR));
    const clientId = await registeredClientId(fetch, browser.ip);
    const { challenge } = await pkce();

    const { response } = await openConsent(fetch, browser, authorizeUrl(clientId, "read", challenge));

    expect([
      await sessionOfResponse(response),
      response.headers.getSetCookie().find((cookie) => cookie.startsWith(`${DEMO_SESSION_COOKIE}=`)),
    ]).toEqual([
      VISITOR,
      expect.stringMatching(/; Path=\/; Max-Age=7200; HttpOnly; SameSite=Lax; Domain=admin-os\.lr0y\.dev; Secure$/),
    ]);
  });

  it.each([
    ["no session", "198.51.100.10", async () => ({})],
    [
      "a forged session",
      "198.51.100.11",
      async () => ({ [DEMO_SESSION_COOKIE]: `${VISITOR}.1793000000.AAAAAAAAAAAAAAAAAAAAAA` }),
    ],
    [
      "an expired session",
      "198.51.100.12",
      async () => ({ [DEMO_SESSION_COOKIE]: await signedSession(VISITOR, DEMO_SESSION_MAX_AGE_S + 1) }),
    ],
  ])("starts a fresh signed session for a visitor with %s", async (_case, ip, cookies) => {
    const browser = browserAt(ip, await cookies());
    const clientId = await registeredClientId(fetch, browser.ip);
    const { challenge } = await pkce();

    const { response } = await openConsent(fetch, browser, authorizeUrl(clientId, "read", challenge));
    const started = await sessionOfResponse(response);

    expect([response.status, started, started === VISITOR]).toEqual([200, expect.any(String), false]);
  });

  it("renders an unknown client's request here and never redirects it", async () => {
    const { challenge } = await pkce();

    const response = await fetch(authorizeUrl("no-such-client", "read", challenge), {
      headers: { "cf-connecting-ip": "198.51.100.20" },
    });

    expect([response.status, response.headers.get("location"), await response.text()]).toEqual([
      400,
      null,
      expect.stringContaining("does not accept"),
    ]);
  });

  it("sends a denial back to the client as access_denied", async () => {
    const browser = browserAt("198.51.100.21", await demoCookies(VISITOR));
    const clientId = await registeredClientId(fetch, browser.ip);
    const { challenge } = await pkce();
    const { form = "" } = await openConsent(fetch, browser, authorizeUrl(clientId, "read", challenge));

    const response = await answerConsent(fetch, browser, form, "deny");

    expect([response.status, response.headers.get("location")]).toEqual([
      302,
      expect.stringMatching(new RegExp(`^${REDIRECT_URI}\\?.*error=access_denied`)),
    ]);
  });

  it("refuses a consent form posted twice", async () => {
    const browser = browserAt("198.51.100.22", await demoCookies(VISITOR));
    const clientId = await registeredClientId(fetch, browser.ip);
    const { challenge } = await pkce();
    const { form = "" } = await openConsent(fetch, browser, authorizeUrl(clientId, "read", challenge));
    await answerConsent(fetch, browser, form, "allow");

    const again = await answerConsent(fetch, browser, form, "allow");

    expect([again.status, await again.text()]).toEqual([400, expect.stringContaining("already used")]);
  });

  it("sends the headers that keep the page unframed and its form posts carrying a real Origin", async () => {
    const browser = browserAt("198.51.100.23", await demoCookies(VISITOR));
    const clientId = await registeredClientId(fetch, browser.ip);
    const { challenge } = await pkce();

    const { response } = await openConsent(fetch, browser, authorizeUrl(clientId, "read", challenge));

    expect([
      response.headers.get("referrer-policy"),
      response.headers.get("content-security-policy"),
      response.headers.get("x-frame-options"),
    ]).toEqual(["same-origin", expect.stringContaining("frame-ancestors 'none'"), "DENY"]);
  });

  it.each([
    ["the opaque null Origin a no-referrer page would send", "null"],
    ["another allowed origin of the Worker", "https://claude.ai"],
    ["the web app", "https://admin-os.lr0y.dev"],
  ])("refuses a consent form posted with %s", async (_case, origin) => {
    const browser = browserAt("198.51.100.24", await demoCookies(VISITOR));
    const clientId = await registeredClientId(fetch, browser.ip);
    const { challenge } = await pkce();
    const { form = "" } = await openConsent(fetch, browser, authorizeUrl(clientId, "read", challenge));

    const response = await answerConsent(fetch, browser, form, "allow", origin);

    expect(response.status).toBe(403);
  });

  it("refuses a handle posted without the browser's consent cookie", async () => {
    const browser = browserAt("198.51.100.25", await demoCookies(VISITOR));
    const clientId = await registeredClientId(fetch, browser.ip);
    const { challenge } = await pkce();
    const { form = "" } = await openConsent(fetch, browser, authorizeUrl(clientId, "read", challenge));
    const otherBrowser = browserAt(browser.ip, await demoCookies(VISITOR));

    const response = await answerConsent(fetch, otherBrowser, form, "allow");

    expect([response.status, await response.text()]).toEqual([400, expect.stringContaining("expired")]);
  });

  it("grants the role the page showed, even if the role cookie changed since", async () => {
    const browser = browserAt("198.51.100.26", await demoCookies(VISITOR, "staff"));
    const clientId = await registeredClientId(fetch, browser.ip);
    const { verifier, challenge } = await pkce();
    const { form = "" } = await openConsent(fetch, browser, authorizeUrl(clientId, "read", challenge));
    browser.cookies.set(DEMO_ROLE_COOKIE, "owner");
    const redirect = await answerConsent(fetch, browser, form, "allow");
    const tokens = await exchangeCode(fetch, browser.ip, clientId, redirect.headers.get("location") ?? "", verifier);
    const agent = await connect(((await tokens.json()) as { access_token: string }).access_token, fetch);

    const me = await agent.callTool({ name: "access_me_get", arguments: {} });

    expect(me.structuredContent).toMatchObject({ roleId: "staff" });
  });

  it("refuses a form whose role was changed, and keeps the transaction for the genuine answer", async () => {
    const browser = browserAt("198.51.100.27", await demoCookies(VISITOR, "staff"));
    const clientId = await registeredClientId(fetch, browser.ip);
    const { challenge } = await pkce();
    const { form = "" } = await openConsent(fetch, browser, authorizeUrl(clientId, "read", challenge));
    const forged = new URLSearchParams(form);
    forged.set("role", "owner");

    const refused = await answerConsent(fetch, browser, forged.toString(), "allow");
    const genuine = await answerConsent(fetch, browser, form, "allow");

    expect([refused.status, genuine.status]).toEqual([400, 302]);
  });

  it("requires PKCE with S256 of a confidential client too, which the provider alone would let skip it", async () => {
    const browser = browserAt("198.51.100.28", await demoCookies(VISITOR));
    const registered = await fetch(`${ISSUER}/register`, {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": browser.ip },
      body: JSON.stringify({
        client_name: "Confidential",
        redirect_uris: [REDIRECT_URI],
        token_endpoint_auth_method: "client_secret_basic",
      }),
    });
    const { client_id: clientId } = (await registered.json()) as { client_id: string };
    const url = new URL(authorizeUrl(clientId, "read", "unused"));
    url.searchParams.delete("code_challenge");
    url.searchParams.delete("code_challenge_method");

    const { response, html, form } = await openConsent(fetch, browser, url.href);

    expect([response.status, form, html]).toEqual([400, undefined, expect.stringContaining("does not accept")]);
  });
});

describe("dynamic client registration (/register)", () => {
  it("refuses a redirect over plain http to a host other than this machine", async () => {
    const response = await fetch(`${ISSUER}/register`, {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": "198.51.100.29" },
      body: JSON.stringify({
        client_name: "Remote http",
        redirect_uris: ["http://agent.example/callback"],
        token_endpoint_auth_method: "none",
      }),
    });

    expect([response.status, await response.json()]).toEqual([
      400,
      {
        error: "invalid_client_metadata",
        error_description: "Redirect URI must use https, or http on a loopback host",
      },
    ]);
  });
});

describe("a grant", () => {
  it("holds read by default, and its token reaches the MCP server", async () => {
    const browser = browserAt("198.51.100.30", await demoCookies(VISITOR, "staff"));
    const granted = await authorize(fetch, browser, await registeredClientId(fetch, browser.ip));
    const client = await connect(granted.accessToken, fetch);

    const me = await client.callTool({ name: "access_me_get", arguments: {} });

    expect([granted.scope, me.structuredContent]).toMatchObject(["read", { roleId: "staff" }]);
  });

  it("acts on the visitor's own session, which the web app reads (AC6 across doors)", async () => {
    const session = crypto.randomUUID();
    const { store, names } = recordingStore(baseEnv.DEMO_STORE);
    const fetchStore = writable({ DEMO_STORE: store });
    const browser = browserAt("198.51.100.31", await demoCookies(session));
    const granted = await authorize(fetchStore, browser, await registeredClientId(fetchStore, browser.ip));
    const agent = await connect(granted.accessToken, fetchStore);
    await agent.listTools();

    const created = await agent.callTool({
      name: "customers_create",
      arguments: { name: "Ada Lovelace", idempotencyKey: "a1a-ac6-0001" },
    });
    const id = (created.structuredContent as { id: string }).id;
    const seen = await webClient(session).call("customers.get", { id });

    expect([new Set(names), seen]).toEqual([
      new Set([`hospitality:${session}`]),
      { ok: true, value: expect.objectContaining({ id, name: "Ada Lovelace" }) },
    ]);
  });

  it("records the client that asked for a held write, for the person who approves it", async () => {
    const session = crypto.randomUUID();
    const fetchStore = writable();
    const browser = browserAt("198.51.100.32", await demoCookies(session, "owner"));
    const clientId = await registeredClientId(fetchStore, browser.ip);
    const agent = await connect((await authorize(fetchStore, browser, clientId)).accessToken, fetchStore);
    await agent.listTools();

    const held = await agent.callTool({
      name: "bookings_cancel",
      arguments: { id: CONFIRMED_BOOKING, reason: "The guest called" },
    });
    const queue = await webClient(session).call("approvals.list", { limit: 10 });

    expect([held.structuredContent, queue]).toMatchObject([
      { status: "awaiting_approval" },
      { ok: true, value: { items: [{ requestedBy: { via: "mcp", role: "owner", clientId } }] } },
    ]);
  });
});

describe("Client ID Metadata Documents", () => {
  const CLIENT_ID = "https://agent.example/oauth/client.json";

  it("shows the client's domain and completes the flow for its metadata document", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      Response.json({
        client_id: CLIENT_ID,
        client_name: "Example Agent",
        redirect_uris: [REDIRECT_URI],
        token_endpoint_auth_method: "none",
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
      }),
    );
    const browser = browserAt("198.51.100.40", await demoCookies(VISITOR));
    const { verifier, challenge } = await pkce();
    const { html, form = "" } = await openConsent(fetch, browser, authorizeUrl(CLIENT_ID, "read", challenge));
    const redirect = await answerConsent(fetch, browser, form, "allow");

    const tokens = await exchangeCode(fetch, browser.ip, CLIENT_ID, redirect.headers.get("location") ?? "", verifier);

    expect([html, tokens.status, await tokens.json()]).toEqual([
      expect.stringMatching(/<strong>Example Agent<\/strong>[\s\S]*Published by <strong>agent\.example<\/strong>/),
      200,
      expect.objectContaining({ token_type: "bearer", scope: "read" }),
    ]);
  });
});

describe("rate limits on the authorization server (AC12)", () => {
  it("answers 429 with Retry-After once one IP has registered too many clients", async () => {
    const allowed = await spend(
      fetch,
      TEST_RATE_LIMIT,
      () =>
        new Request(`${ISSUER}/register`, {
          method: "POST",
          headers: { "content-type": "application/json", "cf-connecting-ip": "198.51.100.50" },
          body: JSON.stringify({
            client_name: "Spam",
            redirect_uris: [REDIRECT_URI],
            token_endpoint_auth_method: "none",
          }),
        }),
    );

    const refused = await register(fetch, "198.51.100.50");

    expect([allowed, refused.status, refused.headers.get("retry-after"), await refused.json()]).toEqual([
      Array(TEST_RATE_LIMIT).fill(201),
      429,
      "60",
      { error: "temporarily_unavailable", error_description: expect.stringMatching(/retry after 60 seconds/) },
    ]);
  });

  it.each([
    ["/register", "POST", "OAUTH_LIMITER"],
    ["/authorize", "GET", "OAUTH_LIMITER"],
    ["/token", "POST", "EDGE_LIMITER"],
  ])("limits %s per client IP with %s", async (path, method, binding) => {
    const { keys, limiter } = limiterRefusing(/.*/);

    const response = await fetchWith({ [binding]: limiter })(`${ISSUER}${path}`, {
      method,
      headers: { "cf-connecting-ip": "198.51.100.51" },
    });

    expect([response.status, keys]).toEqual([429, [`${path}:198.51.100.51`]]);
  });

  it("limits /mcp per client IP before a bearer is looked up in KV", async () => {
    const { keys, limiter } = limiterRefusing(/.*/);
    const kvReads: string[] = [];
    const kv = {
      get: async (key: string) => {
        kvReads.push(key);
        return null;
      },
    };

    const response = await fetchWith({ EDGE_LIMITER: limiter, OAUTH_KV: kv })(ENDPOINT, {
      method: "POST",
      headers: { authorization: "Bearer user:grant:secret", "cf-connecting-ip": "198.51.100.53" },
    });

    expect([
      response.status,
      keys,
      kvReads,
      ((await response.json()) as { error: { code: number } }).error.code,
    ]).toEqual([429, ["/mcp:198.51.100.53"], [], -32000]);
  });

  it("keys an IPv6 client by its /64", async () => {
    const { keys, limiter } = limiterRefusing(/.*/);

    await fetchWith({ OAUTH_LIMITER: limiter })(`${ISSUER}/register`, {
      method: "POST",
      headers: { "cf-connecting-ip": "2001:db8:0:12::abcd" },
    });

    expect(keys).toEqual(["/register:2001:db8:0:12::/64"]);
  });

  it("limits the new demo sessions one IP starts, and never a visitor who has one", async () => {
    const { keys, limiter } = limiterRefusing(/^session:/);
    const limited = fetchWith({ OAUTH_LIMITER: limiter });
    const clientId = await registeredClientId(fetch, "198.51.100.52");
    const { challenge } = await pkce();
    const url = authorizeUrl(clientId, "read", challenge);

    const fresh = await openConsent(limited, browserAt("198.51.100.52"), url);
    const known = await openConsent(limited, browserAt("198.51.100.52", await demoCookies(VISITOR)), url);

    expect([fresh.response.status, known.response.status, keys]).toEqual([
      429,
      200,
      ["/authorize:198.51.100.52", "session:198.51.100.52", "/authorize:198.51.100.52"],
    ]);
  });
});

describe("Origin on the authorization server (AC12)", () => {
  it.each([
    ["/register", "POST"],
    ["/token", "POST"],
    ["/authorize", "GET"],
    ["/authorize", "POST"],
    ["/.well-known/oauth-authorization-server", "GET"],
    ["/.well-known/oauth-protected-resource/mcp", "GET"],
  ])("answers 403 to a foreign Origin on %s (%s)", async (path, method) => {
    const response = await fetch(`${ISSUER}${path}`, { method, headers: { origin: "https://evil.example" } });

    expect(response.status).toBe(403);
  });
});
