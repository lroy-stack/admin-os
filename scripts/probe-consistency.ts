/**
 * The consistency probe (spec 004, AC6): one write, then N reads each over a fresh connection, counting how many
 * reads see the write. The write goes through the kernel, never a module: the web and consent modes change the
 * business trade name on the Settings page, and the mcp mode calls `settings_values_update`, which the default
 * policy holds for approval (ADR 0017 §7). On Cloudflare Workers the demo's state once lived in isolate memory, and a write was seen by
 * 1 read in 12; with the Durable Object store every read must see it.
 *
 * Run it with `npm run probe:consistency [-- web|mcp|consent]`; `BASE_URL` (default http://localhost:8788), `MCP_URL`
 * (default http://localhost:8789/mcp, the MCP Worker under `npm run dev:mcp`), `READS`
 * (default 12) and `MCP_TOKEN` (optional, an owner token; enables the MCP mode) come from the environment. The web mode drives the
 * real UI in Chromium, so the visitor gets a signed `demo_sid` and no Server Action id is hand-crafted.
 *
 * The `consent` mode (plan 005-D3) checks that the two Workers sign with the same `DEMO_SESSION_SECRET`: a web write
 * yields a signed `demo_sid`, a client registers and opens `/authorize` with that cookie, and the renewed cookie must
 * carry the same session id. Any byte of difference between the two secrets, a trailing newline included, makes the
 * consent page start another session. It registers one OAuth client (a KV write) per run, so it is asked for by name
 * and is not part of the default run.
 */
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { chromium } from "@playwright/test";

import {
  consentOutcome,
  countSeen,
  exitCodeOf,
  formatOutcome,
  type ProbeConfig,
  type ProbeMode,
  type ProbeOutcome,
  parseConfig,
  parseModes,
  sessionLabel,
} from "./probe-consistency-report";
import { createHash, randomBytes } from "node:crypto";

const DEMO_SESSION_COOKIE = "demo_sid";
const REQUEST_TIMEOUT_MS = 30_000;
const UI_TIMEOUT_MS = 60_000;

/** `fetch` that asks the server to close the socket after the answer, so no read reuses a connection. */
const freshConnectionFetch = (url: string | URL, init?: RequestInit): Promise<Response> => {
  const headers = new Headers(init?.headers);
  headers.set("connection", "close");
  return fetch(url, { ...init, headers, signal: init?.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
};

const bodyOf = async (response: Response): Promise<string> => (response.ok ? response.text() : "");

/** Changes the trade name in the Edit business details window, as the owner would; returns the signed session cookie. */
async function writeThroughTheUi(config: ProbeConfig, marker: string): Promise<string> {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ baseURL: config.baseUrl });
    await context.addCookies([{ name: "locale", value: "en", url: config.baseUrl }]);
    const page = await context.newPage();
    page.setDefaultTimeout(UI_TIMEOUT_MS);
    await page.goto("/dashboard/settings", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Edit" }).click();
    const dialog = page.getByRole("dialog", { name: "Edit business details" });
    await dialog.getByRole("textbox", { name: "Trade name" }).fill(marker);
    await dialog.getByRole("button", { name: "Save" }).click();
    await page.locator("[data-sonner-toast]").filter({ hasText: "Business details saved." }).waitFor();
    const session = (await context.cookies()).find((cookie) => cookie.name === DEMO_SESSION_COOKIE);
    if (session === undefined) {
      throw new Error(
        `The write succeeded but the server set no ${DEMO_SESSION_COOKIE} cookie; is DATA_STORE=durable set and DEMO_SESSION_SECRET configured?`,
      );
    }
    return session.value;
  } finally {
    await browser.close();
  }
}

async function probeWeb(config: ProbeConfig): Promise<ProbeOutcome> {
  const marker = `Probe ${Date.now()}`;
  const cookie = await writeThroughTheUi(config, marker);
  const url = `${config.baseUrl}/dashboard/settings`;
  const bodies: string[] = [];
  for (let read = 0; read < config.reads; read += 1) {
    const response = await freshConnectionFetch(url, {
      headers: { cookie: `${DEMO_SESSION_COOKIE}=${cookie}; locale=en`, "cache-control": "no-cache" },
    });
    bodies.push(await bodyOf(response));
  }
  return {
    mode: "web",
    status: "ran",
    seen: countSeen(bodies, marker),
    reads: config.reads,
    session: sessionLabel(cookie),
  };
}

/** A client on its own connection: the 2026-07-28 era, every request with `Connection: close`. */
async function connectMcp(config: ProbeConfig, token: string): Promise<Client> {
  const client = new Client(
    { name: "admin-os-consistency-probe", version: "0.0.0" },
    { versionNegotiation: { mode: { pin: "2026-07-28" } } },
  );
  await client.connect(
    new StreamableHTTPClientTransport(new URL(config.mcpUrl), {
      fetch: freshConnectionFetch,
      authProvider: { token: async () => token },
    }),
  );
  return client;
}

/** The server's own label for the token's demo session (`mcp-` and a SHA-256 prefix), so the line names the same one. */
const mcpSessionOf = (token: string): string => createHash("sha256").update(token).digest("hex").slice(0, 32);

/** `business.profile` with every field blank: the held change names only the trade name it probes with. */
const BLANK_PROFILE = { legalName: "", taxId: "", email: "", phone: "", website: "", addressLines: [] };

async function probeMcp(config: ProbeConfig, token: string): Promise<ProbeOutcome> {
  const writer = await connectMcp(config, token);
  try {
    const { tools } = await writer.listTools();
    if (!tools.some((tool) => tool.name === "settings_values_update")) {
      return { mode: "mcp", status: "skipped", reason: "server is read-only" };
    }
    // Held for a person, never applied: the hold is the write, and it carries the id the reads look for.
    const held = await writer.callTool({
      name: "settings_values_update",
      arguments: { values: { "business.profile": { ...BLANK_PROFILE, tradeName: `Probe ${Date.now()}` } } },
    });
    const hold = held.structuredContent as { status?: unknown; approvalId?: unknown } | undefined;
    if (held.isError === true || hold?.status !== "awaiting_approval" || typeof hold.approvalId !== "string") {
      throw new Error(
        `settings_values_update did not answer awaiting_approval (is MCP_TOKEN an owner token?): ${JSON.stringify(held.structuredContent ?? held.content)}`,
      );
    }
    const approvalId = hold.approvalId;
    const bodies: string[] = [];
    for (let read = 0; read < config.reads; read += 1) {
      const reader = await connectMcp(config, token);
      try {
        const got = await reader.callTool({ name: "approvals_get", arguments: { approvalId } });
        bodies.push(got.isError === true ? "" : JSON.stringify(got.structuredContent));
      } finally {
        await reader.close();
      }
    }
    return {
      mode: "mcp",
      status: "ran",
      seen: countSeen(bodies, approvalId),
      reads: config.reads,
      session: sessionLabel(mcpSessionOf(token)),
    };
  } finally {
    await writer.close();
  }
}

/** A loopback redirect, as the native clients register (`workers/mcp/test/oauth-support.ts`). */
const CONSENT_REDIRECT_URI = "http://127.0.0.1:33418/callback";

/** Registers a public client at the MCP Worker (DCR) and answers its id. */
async function registerClient(origin: string): Promise<string> {
  const response = await freshConnectionFetch(`${origin}/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_name: "admin-os consent probe",
      redirect_uris: [CONSENT_REDIRECT_URI],
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
    }),
  });
  const registered = (await response.json().catch(() => undefined)) as { client_id?: unknown } | undefined;
  if (!response.ok || typeof registered?.client_id !== "string") {
    throw new Error(`POST ${origin}/register answered ${response.status}; expected a client_id.`);
  }
  return registered.client_id;
}

async function probeConsent(config: ProbeConfig): Promise<ProbeOutcome> {
  const webCookie = await writeThroughTheUi(config, `Probe ${Date.now()}`);
  const origin = new URL(config.mcpUrl).origin;
  const clientId = await registerClient(origin);
  // PKCE S256: the consent page requires it; the probe never exchanges the code, so the verifier is not kept.
  const challenge = createHash("sha256").update(randomBytes(32).toString("base64url")).digest("base64url");
  const authorize = new URL(`${origin}/authorize`);
  authorize.search = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: CONSENT_REDIRECT_URI,
    scope: "read",
    state: "consent-probe",
    code_challenge: challenge,
    code_challenge_method: "S256",
    resource: config.mcpUrl,
  }).toString();
  const response = await freshConnectionFetch(authorize, {
    headers: { cookie: `${DEMO_SESSION_COOKIE}=${encodeURIComponent(webCookie)}`, "accept-language": "en" },
    redirect: "manual",
  });
  if (response.status !== 200) {
    throw new Error(
      `GET ${authorize.origin}/authorize answered ${response.status}, not the consent page: ${(await response.text()).slice(0, 200)}`,
    );
  }
  return consentOutcome(webCookie, response.headers.getSetCookie());
}

async function run(mode: ProbeMode, config: ProbeConfig): Promise<ProbeOutcome> {
  if (mode === "web") return probeWeb(config);
  if (mode === "consent") return probeConsent(config);
  if (config.mcpToken === undefined) return { mode, status: "skipped", reason: "no MCP_TOKEN" };
  return probeMcp(config, config.mcpToken);
}

async function main(): Promise<number> {
  const config = parseConfig(process.env);
  const modes = parseModes(process.argv.slice(2));
  const outcomes: ProbeOutcome[] = [];
  for (const mode of modes) {
    const outcome = await run(mode, config);
    outcomes.push(outcome);
    console.log(formatOutcome(outcome));
  }
  return exitCodeOf(outcomes);
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    console.error(`probe failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  },
);
