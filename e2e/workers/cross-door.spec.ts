import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { expect, type Page, test } from "@playwright/test";

import { createHash, randomBytes } from "node:crypto";

/**
 * People decide, across the doors (spec 004 AC5, ADR 0016 D7; plan 005 M-H1b). An agent that holds a `read write`
 * grant bound to a visitor's browser session asks to cancel a booking; the default policy holds the write; the
 * visitor approves it in the web app's bell; the booking is then cancelled for both doors.
 *
 * It runs against `wrangler dev` (web and store in one process, the MCP Worker in another, one shared
 * `DEMO_SESSION_SECRET`): `npm run test:e2e:workers`, see `playwright.workers.config.ts`.
 */

const MCP_ORIGIN = `http://localhost:${process.env.E2E_MCP_PORT ?? 8789}`;
const MCP_URL = `${MCP_ORIGIN}/mcp`;
/** A native client's loopback callback, the redirect Claude Code and most desktop clients use. */
const REDIRECT_URI = "http://127.0.0.1:33418/callback";
/** Seeded tonight, confirmed, guest "Castaño" (`src/verticals/hospitality/seed.ts`). */
const BOOKING_ID = "R-1046";
const BOOKING_GUEST = /Castaño/;

/** A visitor's first write through the web app, so the browser gets its signed `demo_sid`. */
async function writeThroughTheWebApp(page: Page, contact: string): Promise<void> {
  await page.goto("/dashboard/customers", { waitUntil: "networkidle" });
  await page.getByRole("main").getByRole("button", { name: "Add contact" }).click();
  const dialog = page.getByRole("dialog", { name: "Add contact" });
  await dialog.getByRole("textbox", { name: "Name" }).fill(contact);
  await dialog.getByRole("button", { name: "Add contact" }).click();
  await expect(page.locator("[data-sonner-toast]").filter({ hasText: `Contact added: ${contact}` })).toBeVisible();
}

/**
 * The MCP client's authorization (MCP authorization 2026-07-28), as the MCP Worker's own tests walk it: register,
 * open `/authorize` in the visitor's browser, choose "Allow reading and changes", exchange the code. Answers the
 * access token.
 */
async function grantReadAndWrite(page: Page): Promise<string> {
  const registration = await page.request.post(`${MCP_ORIGIN}/register`, {
    data: {
      client_name: "Cross-door e2e agent",
      redirect_uris: [REDIRECT_URI],
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
    },
  });
  expect(registration.status()).toBe(201);
  const { client_id: clientId } = (await registration.json()) as { client_id: string };

  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const authorize = new URL(`${MCP_ORIGIN}/authorize`);
  authorize.search = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    scope: "read write",
    state: "cross-door",
    code_challenge: challenge,
    code_challenge_method: "S256",
    resource: MCP_URL,
  }).toString();

  // Nothing listens on the loopback callback; the browser's redirect to it carries the code.
  await page.route(`${REDIRECT_URI}**`, (route) => route.fulfill({ status: 200, body: "connected" }));
  const callback = page.waitForRequest((request) => request.url().startsWith(REDIRECT_URI));
  await page.goto(authorize.href);
  await page.getByRole("button", { name: "Allow reading and changes" }).click();
  const code = new URL((await callback).url()).searchParams.get("code");
  expect(code).not.toBeNull();

  const exchanged = await page.request.post(`${MCP_ORIGIN}/token`, {
    form: {
      grant_type: "authorization_code",
      code: code ?? "",
      redirect_uri: REDIRECT_URI,
      client_id: clientId,
      code_verifier: verifier,
      resource: MCP_URL,
    },
  });
  expect(exchanged.status()).toBe(200);
  const tokens = (await exchanged.json()) as { access_token: string; scope: string };
  expect(tokens.scope).toBe("read write");
  return tokens.access_token;
}

/** An MCP client with the token, as an agent connects. */
async function connectAgent(token: string): Promise<Client> {
  const client = new Client(
    { name: "admin-os-cross-door-e2e", version: "0.0.0" },
    { versionNegotiation: { mode: { pin: "2026-07-28" } } },
  );
  await client.connect(
    new StreamableHTTPClientTransport(new URL(MCP_URL), { authProvider: { token: async () => token } }),
  );
  return client;
}

test.describe("a held write crosses from the agent's door to the person's", () => {
  test("an agent's cancel waits in the bell, and approving it cancels the booking in both doors", async ({
    page,
    context,
    baseURL,
  }) => {
    await context.addCookies([{ name: "locale", value: "en", url: baseURL }]);

    await writeThroughTheWebApp(page, `Cross door ${Date.now()}`);
    const agent = await connectAgent(await grantReadAndWrite(page));
    try {
      const held = await agent.callTool({
        name: "bookings_cancel",
        arguments: { id: BOOKING_ID, reason: "The guest called to cancel" },
      });
      expect(held.structuredContent).toMatchObject({ status: "awaiting_approval", approvalId: expect.any(String) });
      const { approvalId } = held.structuredContent as { approvalId: string };

      const pending = await agent.callTool({ name: "approvals_get", arguments: { approvalId } });
      expect(pending.structuredContent).toMatchObject({ status: "pending" });

      await page.goto("/dashboard/default");
      await page.getByRole("button", { name: /unread notification/ }).click();
      const panel = page.getByRole("dialog", { name: "Notifications" });
      await panel.getByRole("button", { name: "Approve", exact: true }).click();
      await page
        .getByRole("alertdialog", { name: "Approve this request?" })
        .getByRole("button", { name: "Approve" })
        .click();
      await expect(page.locator("[data-sonner-toast]").filter({ hasText: "Request approved" })).toBeVisible();

      const decided = await agent.callTool({ name: "approvals_get", arguments: { approvalId } });
      expect(decided.structuredContent).toMatchObject({ status: "approved" });
      const booking = await agent.callTool({ name: "bookings_get", arguments: { id: BOOKING_ID } });
      expect(booking.structuredContent).toMatchObject({ id: BOOKING_ID, status: "cancelled" });

      await page.goto("/dashboard/bookings");
      await page.getByRole("radiogroup", { name: "Reservations view" }).getByRole("radio", { name: "List" }).click();
      await page.getByRole("button", { name: "Service tools" }).click();
      await page.getByRole("menuitemcheckbox", { name: "Show completed and cancelled" }).click();
      await expect(
        page.getByRole("row", { name: BOOKING_GUEST }).getByRole("cell", { name: "Cancelled" }),
      ).toBeVisible();
    } finally {
      await agent.close();
    }
  });
});
