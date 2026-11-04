import type { GrantSummary } from "@cloudflare/workers-oauth-provider";
import { z } from "zod";

import { DEMO_SESSION_COOKIE, verifyDemoSession } from "@/config/demo-session";
import { format, formatDateTime, type Locale } from "@/core/i18n";

import { consentMessages } from "./consent-messages";
import { cookieOf } from "./cookies";
import { type McpWorkerEnv, variablesOf } from "./env";
import { escapeHtml, htmlPage, localeOf, pageHeaders } from "./page";

/**
 * The visitor's connected apps at `/grants` (ADR 0016 D3): every grant of this browser's demo session, each revocable.
 * A grant's `userId` is the session id, so a visitor reaches only their own grants, and revoking one ends its tokens
 * at once; the app then has to connect again, which asks for `read` by default.
 */
export const GRANTS_PATH = "/grants";

/** Grants this page lists; a demo session holds a few, one per app that connected to it. */
const PAGE_SIZE = 50;

const grantIdSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{1,128}$/)
  .catch("");

const metadataSchema = z.object({ clientName: z.string() }).partial().catch({});

const grantRow = (locale: Locale, grant: GrantSummary): string => {
  const text = consentMessages[locale].grants;
  const name = metadataSchema.parse(grant.metadata).clientName ?? grant.clientId;
  // The day only: the Worker knows no visitor time zone, and a UTC time of day would read as the visitor's own.
  const since = formatDateTime(grant.createdAt * 1000, locale, "UTC", { dateStyle: "medium" });
  return [
    `<li><p><strong>${escapeHtml(name)}</strong></p>`,
    `<p class="muted">${escapeHtml(grant.scope.includes("write") ? text.write : text.read)} · ${escapeHtml(format(text.since, locale, { date: since }))}</p>`,
    `<form method="post"><input type="hidden" name="grantId" value="${escapeHtml(grant.id)}">`,
    `<div class="actions"><button name="revoke" value="1">${escapeHtml(text.revoke)}</button></div></form></li>`,
  ].join("");
};

async function listGrants(request: Request, env: McpWorkerEnv, sessionId: string | undefined): Promise<Response> {
  const locale = localeOf(request);
  const text = consentMessages[locale].grants;
  const grants =
    sessionId === undefined ? [] : (await env.OAUTH_PROVIDER.listUserGrants(sessionId, { limit: PAGE_SIZE })).items;
  const revoked = new URL(request.url).searchParams.has("revoked");
  const body = [
    `<h1>${escapeHtml(text.title)}</h1>`,
    revoked ? `<p class="warning" role="status">${escapeHtml(text.revoked)}</p>` : "",
    `<p class="muted">${escapeHtml(grants.length === 0 ? text.empty : text.intro)}</p>`,
    grants.length === 0 ? "" : `<ul>${grants.map((grant) => grantRow(locale, grant)).join("")}</ul>`,
  ].join("\n");
  return new Response(htmlPage(locale, escapeHtml(text.title), body), { headers: pageHeaders() });
}

/** `POST /grants`: revokes one of this session's grants, then shows the page again (`303`, so a reload never reposts). */
async function revoke(request: Request, env: McpWorkerEnv, sessionId: string | undefined): Promise<Response> {
  const grantId = grantIdSchema.parse((await request.formData()).get("grantId"));
  if (sessionId !== undefined && grantId !== "") await env.OAUTH_PROVIDER.revokeGrant(grantId, sessionId);
  return new Response(null, {
    status: 303,
    headers: { Location: `${GRANTS_PATH}?revoked`, "Cache-Control": "no-store" },
  });
}

/** `GET /grants` lists this browser's grants; `POST /grants` revokes one. Without a valid session there are none. */
export async function serveGrants(request: Request, env: McpWorkerEnv): Promise<Response> {
  const sessionId = await verifyDemoSession(cookieOf(request, DEMO_SESSION_COOKIE), Date.now(), variablesOf(env));
  return request.method === "POST" ? revoke(request, env, sessionId) : listGrants(request, env, sessionId);
}
