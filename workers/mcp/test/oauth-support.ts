import { demoActor } from "@/config/actor";
import { CATALOG } from "@/config/catalog";
import { getAdapter } from "@/config/data.server";
import { DEMO_ROLE_COOKIE, DEMO_SESSION_COOKIE, signDemoSession } from "@/config/demo-session";
import { VERTICALS } from "@/config/vertical";
import type { RoleId } from "@/core/access";
import { createClient, type DataClient } from "@/core/client";

import { variablesOf } from "../src/env";
import { baseEnv, ENDPOINT } from "./support";

/**
 * The web app's door to a visitor's session, as its Server Actions open it (`getRuntime`): the durable adapter on
 * `hospitality:<sessionId>` in the store, acting through the UI.
 */
export const webClient = (sessionId: string, roleId: RoleId = "owner"): DataClient<typeof CATALOG> =>
  createClient(
    CATALOG,
    getAdapter({ vertical: "hospitality", sessionId, store: () => baseEnv.DEMO_STORE }, { DATA_STORE: "durable" }),
    { actor: demoActor(roleId, VERTICALS.hospitality), via: "ui", logger: () => undefined },
  );

/** Sends `count` requests one after another and answers each status: spends a per-IP window on purpose. */
export const spend = async (fetch: WorkerFetch, count: number, request: () => Request): Promise<number[]> => {
  const statuses: number[] = [];
  for (let sent = 0; sent < count; sent++) statuses.push((await fetch(request())).status);
  return statuses;
};

/**
 * A scripted OAuth client and browser for the MCP Worker's authorization server, as a real MCP client walks it
 * (MCP authorization 2026-07-28): register (DCR) or present a metadata document (CIMD), authorize with PKCE and the
 * resource indicator, consent in the browser, exchange the code. Each flow uses its own client IP, so the per-IP
 * limits of one test never spend another's window.
 */

export type WorkerFetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export const ISSUER = "https://mcp.admin-os.lr0y.dev";
/** A native client's loopback callback, the redirect Claude Code and most desktop clients use. */
export const REDIRECT_URI = "http://127.0.0.1:33418/callback";

/** A visitor's browser: its cookies, kept across requests as a browser keeps them, and its address. */
export interface Browser {
  readonly ip: string;
  readonly cookies: Map<string, string>;
}

export const browserAt = (ip: string, cookies: Readonly<Record<string, string>> = {}): Browser => ({
  ip,
  cookies: new Map(Object.entries(cookies)),
});

/** A `demo_sid` the web app would have set for `sessionId`, signed with the test Worker's secret, `ageS` ago. */
export const signedSession = (sessionId: string, ageS = 0): Promise<string> =>
  signDemoSession(sessionId, Date.now() - ageS * 1000, variablesOf(baseEnv));

/** The visitor's demo cookies, as the web app sets them. */
export const demoCookies = async (sessionId: string, role?: string): Promise<Record<string, string>> => ({
  [DEMO_SESSION_COOKIE]: await signedSession(sessionId),
  ...(role === undefined ? {} : { [DEMO_ROLE_COOKIE]: role }),
});

const cookieHeaderOf = (browser: Browser): string =>
  [...browser.cookies].map(([name, value]) => `${name}=${encodeURIComponent(value)}`).join("; ");

/** Keeps what a response sets, as the browser would. */
const remember = (browser: Browser, response: Response): void => {
  for (const line of response.headers.getSetCookie()) {
    const [pair = ""] = line.split(";");
    const separator = pair.indexOf("=");
    browser.cookies.set(pair.slice(0, separator), decodeURIComponent(pair.slice(separator + 1)));
  }
};

/** Dynamic Client Registration of a public client with a loopback callback; answers the registration response. */
export const register = (fetch: WorkerFetch, ip: string, clientName = "Test Agent"): Promise<Response> =>
  fetch(`${ISSUER}/register`, {
    method: "POST",
    headers: { "content-type": "application/json", "cf-connecting-ip": ip },
    body: JSON.stringify({
      client_name: clientName,
      redirect_uris: [REDIRECT_URI],
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
    }),
  });

export const registeredClientId = async (fetch: WorkerFetch, ip: string, clientName?: string): Promise<string> =>
  ((await (await register(fetch, ip, clientName)).json()) as { client_id: string }).client_id;

const base64Url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");

/** A PKCE pair, S256 (the only method MCP allows). */
export const pkce = async (): Promise<{ verifier: string; challenge: string }> => {
  const verifier = base64Url(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return { verifier, challenge: base64Url(new Uint8Array(digest)) };
};

/** The authorization request a client opens in the browser, with the resource indicator (RFC 8707). */
export const authorizeUrl = (clientId: string, scope: string, challenge: string, resource = ENDPOINT): string => {
  const url = new URL(`${ISSUER}/authorize`);
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    scope,
    state: "state-0001",
    code_challenge: challenge,
    code_challenge_method: "S256",
    resource,
  }).toString();
  return url.href;
};

/** An HTML attribute value as the browser reads it back (the page escapes with numeric references). */
const unescapeHtml = (value: string): string =>
  value.replace(/&#([0-9]+);/g, (_whole, code: string) => String.fromCharCode(Number(code)));

/**
 * `GET /authorize` in the browser; the consent form's hidden fields as the browser would post them (`form`), and its
 * handle, when the page has a form.
 */
export const openConsent = async (fetch: WorkerFetch, browser: Browser, url: string) => {
  const response = await fetch(url, { headers: { cookie: cookieHeaderOf(browser), "cf-connecting-ip": browser.ip } });
  remember(browser, response);
  const html = await response.text();
  const fields = [...html.matchAll(/<input type="hidden" name="([a-z]+)" value="([^"]*)">/g)].map(
    ([, name = "", value = ""]): [string, string] => [name, unescapeHtml(value)],
  );
  const handle = fields.find(([name]) => name === "handle")?.[1];
  return { response, html, handle, form: fields.length === 0 ? undefined : new URLSearchParams(fields).toString() };
};

/**
 * The visitor's answer on the consent form (`allow`, `allow_write` or `deny`), with the form's hidden fields
 * (`openConsent().form`), posted from `origin` (the page's own, as a browser sends it).
 */
export const answerConsent = async (
  fetch: WorkerFetch,
  browser: Browser,
  form: string,
  decision: string,
  origin = ISSUER,
): Promise<Response> => {
  const body = new URLSearchParams(form);
  body.set("decision", decision);
  const response = await fetch(`${ISSUER}/authorize`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: cookieHeaderOf(browser),
      origin,
      "cf-connecting-ip": browser.ip,
    },
    body: body.toString(),
  });
  remember(browser, response);
  return response;
};

/** The token endpoint's answer to the authorization code the consent redirected with. */
export const exchangeCode = async (
  fetch: WorkerFetch,
  ip: string,
  clientId: string,
  location: string,
  verifier: string,
): Promise<Response> =>
  fetch(`${ISSUER}/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", "cf-connecting-ip": ip },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: new URL(location).searchParams.get("code") ?? "",
      redirect_uri: REDIRECT_URI,
      client_id: clientId,
      code_verifier: verifier,
      resource: ENDPOINT,
    }).toString(),
  });

/** A `tools/call` POST in the 2025 stateless form, one HTTP request with no client in between. */
export const toolCallRequest = (token: string, name: string, args: Record<string, unknown> = {}): RequestInit => ({
  method: "POST",
  headers: {
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
    "mcp-protocol-version": "2025-11-25",
  },
  body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }),
});

/** `GET /grants` in the browser, with the ids of the grants it lists. */
export const openGrants = async (fetch: WorkerFetch, browser: Browser) => {
  const response = await fetch(`${ISSUER}/grants`, {
    headers: { cookie: cookieHeaderOf(browser), "cf-connecting-ip": browser.ip },
  });
  const html = await response.text();
  return { response, html, grantIds: [...html.matchAll(/name="grantId" value="([^"]+)"/g)].map((match) => match[1]) };
};

/** The "Revoke" button of one grant on `/grants`. */
export const revokeOnPage = (fetch: WorkerFetch, browser: Browser, grantId: string): Promise<Response> =>
  fetch(`${ISSUER}/grants`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: cookieHeaderOf(browser),
      origin: ISSUER,
      "cf-connecting-ip": browser.ip,
    },
    body: new URLSearchParams({ grantId, revoke: "1" }).toString(),
  });

export interface Authorized {
  readonly clientId: string;
  readonly accessToken: string;
  readonly scope: string;
}

/** The whole flow for `clientId`: authorize for `scope`, answer `decision`, exchange the code. */
export const authorize = async (
  fetch: WorkerFetch,
  browser: Browser,
  clientId: string,
  scope = "read",
  decision = "allow",
): Promise<Authorized> => {
  const { verifier, challenge } = await pkce();
  const { form = "" } = await openConsent(fetch, browser, authorizeUrl(clientId, scope, challenge));
  const redirect = await answerConsent(fetch, browser, form, decision);
  const tokens = (await (
    await exchangeCode(fetch, browser.ip, clientId, redirect.headers.get("location") ?? "", verifier)
  ).json()) as { access_token: string; scope: string };
  return { clientId, accessToken: tokens.access_token, scope: tokens.scope };
};
