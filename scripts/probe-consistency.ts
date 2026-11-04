/**
 * The consistency probe (spec 004, AC6): one write, then N reads each over a fresh connection, counting how many
 * reads see the write. On Cloudflare Workers the demo's state once lived in isolate memory, and a write was seen by
 * 1 read in 12; with the Durable Object store every read must see it.
 *
 * Run it with `npm run probe:consistency [-- web|mcp]`; `BASE_URL` (default http://localhost:8788), `READS`
 * (default 12) and `MCP_TOKEN` (optional, enables the MCP mode) come from the environment. The web mode drives the
 * real UI in Chromium, so the visitor gets a signed `demo_sid` and no Server Action id is hand-crafted.
 */
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { chromium } from "@playwright/test";

import {
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
import { createHash, randomUUID } from "node:crypto";

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

/** Adds a contact through the New contact window, as a visitor would; returns the signed session cookie value. */
async function writeThroughTheUi(config: ProbeConfig, marker: string): Promise<string> {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ baseURL: config.baseUrl });
    await context.addCookies([{ name: "locale", value: "en", url: config.baseUrl }]);
    const page = await context.newPage();
    page.setDefaultTimeout(UI_TIMEOUT_MS);
    await page.goto("/dashboard/customers", { waitUntil: "networkidle" });
    await page.getByRole("main").getByRole("button", { name: "Add contact" }).click();
    const dialog = page.getByRole("dialog", { name: "Add contact" });
    await dialog.getByRole("textbox", { name: "Name" }).fill(marker);
    await dialog.getByRole("button", { name: "Add contact" }).click();
    await page
      .locator("[data-sonner-toast]")
      .filter({ hasText: `Contact added: ${marker}` })
      .waitFor();
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
  const url = `${config.baseUrl}/dashboard/customers?q=${encodeURIComponent(marker)}`;
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
    new StreamableHTTPClientTransport(new URL("/api/mcp", config.baseUrl), {
      fetch: freshConnectionFetch,
      authProvider: { token: async () => token },
    }),
  );
  return client;
}

/** The server's own label for the token's demo session (`mcp-` and a SHA-256 prefix), so the line names the same one. */
const mcpSessionOf = (token: string): string => createHash("sha256").update(token).digest("hex").slice(0, 32);

async function probeMcp(config: ProbeConfig, token: string): Promise<ProbeOutcome> {
  const marker = `Probe ${Date.now()}`;
  const writer = await connectMcp(config, token);
  try {
    const { tools } = await writer.listTools();
    if (!tools.some((tool) => tool.name === "customers_create")) {
      return { mode: "mcp", status: "skipped", reason: "server is read-only" };
    }
    const created = await writer.callTool({
      name: "customers_create",
      arguments: { name: marker, idempotencyKey: randomUUID() },
    });
    const customer = created.structuredContent as { id?: unknown } | undefined;
    if (created.isError === true || typeof customer?.id !== "string") {
      throw new Error(`customers_create failed: ${JSON.stringify(created.structuredContent ?? created.content)}`);
    }
    const id = customer.id;
    const bodies: string[] = [];
    for (let read = 0; read < config.reads; read += 1) {
      const reader = await connectMcp(config, token);
      try {
        const got = await reader.callTool({ name: "customers_get", arguments: { id } });
        bodies.push(got.isError === true ? "" : JSON.stringify(got.structuredContent));
      } finally {
        await reader.close();
      }
    }
    return {
      mode: "mcp",
      status: "ran",
      seen: countSeen(bodies, marker),
      reads: config.reads,
      session: sessionLabel(mcpSessionOf(token)),
    };
  } finally {
    await writer.close();
  }
}

async function run(mode: ProbeMode, config: ProbeConfig): Promise<ProbeOutcome> {
  if (mode === "web") return probeWeb(config);
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
