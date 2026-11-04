import {
  AuthorizationError,
  type AuthRequest,
  CimdFetchError,
  type ConsentDescription,
} from "@cloudflare/workers-oauth-provider";

import { APP_CONFIG } from "@/config/app-config";
import { demoCookieScope } from "@/config/demo-cookie";
import {
  DEMO_ROLE_COOKIE,
  DEMO_SESSION_COOKIE,
  DEMO_SESSION_MAX_AGE_S,
  demoRoleOf,
  signDemoSession,
  signDemoValue,
  verifyDemoSession,
  verifyDemoValue,
} from "@/config/demo-session";
import type { McpEnv } from "@/config/mcp.server";
import { type RoleId, roleIdSchema } from "@/core/access";
import { accessMessages } from "@/core/access/server";
import { format, LOCALE_COOKIE, type Locale, resolveLocale } from "@/core/i18n";

import { type ConsentMessages, consentMessages } from "./consent-messages";
import { cookieOf, sessionCookieHeader } from "./cookies";
import { type McpWorkerEnv, rateLimitPeriodOf, variablesOf } from "./env";
import { clientIpOf, oauthRefusal, overLimit } from "./limits";
import { escapeHtml, htmlPage, pageHeaders } from "./page";

/**
 * The consent page at `/authorize` (ADR 0016 D4, resolution 2), in the provider's documented pattern
 * (`docs/consent-page.md` of `workers-oauth-provider`): the request is validated, the visitor's signed demo session is
 * read (or started, as the web app does), and the grant is bound to it: `props: {sessionId, role}`, `scope: ["read"]`.
 */

/** What a grant carries to every request made with its tokens (`ctx.props`). */
export interface GrantProps {
  readonly sessionId: string;
  readonly role: RoleId;
}

/** What the grant stores in the clear beside it, for the person who reviews their grants. */
export interface GrantMetadata {
  readonly clientName: string;
}

/** The scope every grant holds; `write` is never granted by default (spec 004 D3). */
export const DEFAULT_SCOPE = ["read"] as const;

const localeOf = (request: Request): Locale =>
  resolveLocale({
    cookie: cookieOf(request, LOCALE_COOKIE),
    acceptLanguage: request.headers.get("accept-language"),
    defaultLocale: APP_CONFIG.i18n.defaultLocale,
  });

interface VisitorSession {
  readonly sessionId: string;
  /** The renewed (or new) signed cookie, sent with the page or the redirect. */
  readonly setCookie: string;
}

/**
 * The visitor's demo session: the `demo_sid` the web app signed, or a fresh one when it is missing, forged or expired,
 * as the web app starts one on a first write. Either way the cookie is renewed, so the grant and the web app keep
 * reading the same session. A new session is a new Durable Object later, so starting one is limited per client IP.
 */
async function visitorSession(
  request: Request,
  env: McpWorkerEnv,
  variables: McpEnv,
): Promise<VisitorSession | Response> {
  const now = Date.now();
  const known = await verifyDemoSession(cookieOf(request, DEMO_SESSION_COOKIE), now, variables);
  if (known === undefined) {
    const refused = await overLimit(
      env.OAUTH_LIMITER,
      `session:${clientIpOf(request)}`,
      rateLimitPeriodOf(variables),
      oauthRefusal,
    );
    if (refused !== undefined) return refused;
  }
  const sessionId = known ?? crypto.randomUUID();
  const setCookie = sessionCookieHeader(
    DEMO_SESSION_COOKIE,
    await signDemoSession(sessionId, now, variables),
    DEMO_SESSION_MAX_AGE_S,
    demoCookieScope(variables, new URL(request.url).host),
  );
  return { sessionId, setCookie };
}

/** The page for a request that cannot go on; nothing came back from the client, so it is rendered here. */
const errorPage = (locale: Locale, reason: keyof Omit<ConsentMessages["error"], "title" | "startAgain">): Response => {
  const text = consentMessages[locale].error;
  const body = `<h1>${escapeHtml(text.title)}</h1><p>${escapeHtml(text[reason])}</p><p class="muted">${escapeHtml(text.startAgain)}</p>`;
  return new Response(htmlPage(locale, escapeHtml(text.title), body), { status: 400, headers: pageHeaders() });
};

/**
 * What the page showed, bound to its consent transaction: the role it named and the client's name. The form carries
 * them signed with the session secret, so the grant gets the role the visitor saw (not a `demo_role` changed in
 * another tab), and approving needs no second client lookup (a CIMD fetch that failed after `approveConsent` would
 * lose the transaction).
 */
interface Shown {
  readonly role: RoleId;
  readonly clientName: string;
}

const shownParts = (handle: string, shown: Shown): string[] => ["consent", handle, shown.role, shown.clientName];

const shownFields = async (handle: string, shown: Shown, variables: McpEnv): Promise<string> => {
  const signature = await signDemoValue(shownParts(handle, shown), variables);
  return [
    `<input type="hidden" name="handle" value="${escapeHtml(handle)}">`,
    `<input type="hidden" name="role" value="${shown.role}">`,
    `<input type="hidden" name="client" value="${escapeHtml(shown.clientName)}">`,
    `<input type="hidden" name="shown" value="${signature}">`,
  ].join("");
};

/** The role and client name the form posted, or undefined when they are not what this Worker signed for `handle`. */
const shownOf = async (form: FormData, handle: string, variables: McpEnv): Promise<Shown | undefined> => {
  const role = roleIdSchema.safeParse(form.get("role"));
  const clientName = form.get("client");
  const signature = form.get("shown");
  if (!role.success || typeof clientName !== "string" || typeof signature !== "string") return undefined;
  const shown = { role: role.data, clientName };
  return (await verifyDemoValue(shownParts(handle, shown), signature, variables)) ? shown : undefined;
};

/** The consent form: who asks (escaped: every client string is the client's choice), where access goes, what it is. */
const consentPage = (locale: Locale, details: ConsentDescription, fields: string, role: RoleId): string => {
  const text = consentMessages[locale];
  const client = escapeHtml(details.clientName);
  const origin =
    details.clientDomain === undefined
      ? escapeHtml(text.unverified)
      : format(escapeHtml(text.publishedBy), locale, {
          domain: `<strong>${escapeHtml(details.clientDomain)}</strong>`,
        });
  const body = [
    `<h1>${format(escapeHtml(text.heading), locale, { client: `<strong>${client}</strong>` })}</h1>`,
    `<p>${origin} ${format(escapeHtml(text.redirect), locale, { host: `<strong>${escapeHtml(details.redirectHost)}</strong>` })}</p>`,
    details.redirectIsLoopback ? `<p class="warning">${escapeHtml(text.loopback)}</p>` : "",
    `<p class="muted">${escapeHtml(format(text.actsAs, locale, { role: accessMessages[locale].roles[role] }))}</p>`,
    `<h2>${escapeHtml(text.read.title)}</h2><p>${escapeHtml(text.read.body)}</p>`,
    `<form method="post">${fields}`,
    `<div class="actions"><button class="primary" name="decision" value="allow">${escapeHtml(text.allow)}</button>`,
    `<button name="decision" value="deny">${escapeHtml(text.deny)}</button></div></form>`,
  ].join("\n");
  return htmlPage(locale, format(escapeHtml(text.title), locale, { client }), body);
};

async function showConsent(request: Request, env: McpWorkerEnv, locale: Locale): Promise<Response> {
  const oauth = env.OAUTH_PROVIDER;
  let authRequest: AuthRequest;
  let details: ConsentDescription;
  try {
    authRequest = await oauth.parseAuthRequest(request);
    // Before beginConsent: a failed lookup leaves nothing in KV.
    details = await oauth.describeConsent(authRequest);
  } catch (error) {
    if (error instanceof AuthorizationError && error.redirectTo !== undefined) {
      return Response.redirect(error.redirectTo, 302);
    }
    if (error instanceof AuthorizationError) return errorPage(locale, "invalidRequest");
    if (error instanceof CimdFetchError) return errorPage(locale, "unverifiedClient");
    throw error;
  }
  // MCP requires PKCE with S256 of every client; the provider demands it of public clients only.
  if (authRequest.codeChallenge === undefined || authRequest.codeChallengeMethod !== "S256") {
    return errorPage(locale, "invalidRequest");
  }
  const variables = variablesOf(env);
  const session = await visitorSession(request, env, variables);
  if (session instanceof Response) return session;
  const consent = await oauth.beginConsent(authRequest);
  const headers = pageHeaders(consent.headers);
  headers.append("Set-Cookie", session.setCookie);
  const role = demoRoleOf(cookieOf(request, DEMO_ROLE_COOKIE));
  const fields = await shownFields(consent.handle, { role, clientName: details.clientName }, variables);
  return new Response(consentPage(locale, details, fields, role), { headers });
}

async function decide(request: Request, env: McpWorkerEnv, locale: Locale): Promise<Response> {
  const oauth = env.OAUTH_PROVIDER;
  const variables = variablesOf(env);
  const form = await request.formData();
  const handle = String(form.get("handle") ?? "");
  try {
    if (form.get("decision") !== "allow") {
      const denied = await oauth.denyConsent(request, handle);
      return new Response(null, { status: 302, headers: denied.headers });
    }
    // Checked before approveConsent, so a form that was tampered with leaves the transaction to a genuine answer.
    const shown = await shownOf(form, handle, variables);
    if (shown === undefined) return errorPage(locale, "expired");
    const session = await visitorSession(request, env, variables);
    if (session instanceof Response) return session;
    const approved = await oauth.approveConsent(request, handle, { scope: [...DEFAULT_SCOPE] });
    const props: GrantProps = { sessionId: session.sessionId, role: shown.role };
    const metadata: GrantMetadata = { clientName: shown.clientName };
    const { redirectTo } = await oauth.completeAuthorization({
      // From storage, never from the form.
      request: approved.request,
      userId: session.sessionId,
      metadata,
      scope: [...DEFAULT_SCOPE],
      props,
    });
    approved.headers.set("Location", redirectTo);
    approved.headers.append("Set-Cookie", session.setCookie);
    return new Response(null, { status: 302, headers: approved.headers });
  } catch (error) {
    if (error instanceof AuthorizationError) return errorPage(locale, "expired");
    if (error instanceof CimdFetchError) return errorPage(locale, "unverifiedClient");
    throw error;
  }
}

/** `GET /authorize` shows the consent page; `POST /authorize` is the visitor's answer. */
export function serveAuthorize(request: Request, env: McpWorkerEnv): Promise<Response> {
  const locale = localeOf(request);
  return request.method === "POST" ? decide(request, env, locale) : showConsent(request, env, locale);
}
