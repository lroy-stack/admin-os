import "server-only";

import { cookies, headers } from "next/headers";

import { resetDemoData } from "./data.server";
import { demoCookieScope } from "./demo-cookie";
import { DEMO_SESSION_COOKIE, DEMO_SESSION_MAX_AGE_S, signDemoSession, verifyDemoSession } from "./demo-session";
import type { VerticalId } from "./vertical";

/**
 * The UI's demo session cookie (ADR 0005), over the signing in `demo-session.ts` that the MCP Worker's consent page
 * shares. Kept apart from `data.server.ts` so the adapter wiring has no `next/headers` import and the stdio MCP
 * transport can load it outside Next (ADR 0009).
 */

export { DEMO_SESSION_COOKIE, DEMO_SESSION_MAX_AGE_S };

/**
 * The session id a `demo_sid` cookie carries, or undefined when it is missing, malformed, unsigned, signed with
 * another key or older than the session's lifetime: such a visitor has no session and starts a fresh one on the next
 * write.
 */
export const verifiedDemoSession = (cookieValue: string | undefined, now: number = Date.now()) =>
  verifyDemoSession(cookieValue, now, process.env);

/** The cookie scope for this request: shared with the configured domain's subdomains only on that domain's hosts. */
export async function demoCookieScopeForRequest() {
  return demoCookieScope(process.env, (await headers()).get("host"));
}

/**
 * For Server Actions before a write: the visitor's demo session, started on the first write. Every write renews the
 * cookie, so it lasts as long as the store keeps the session (two hours after the last write).
 */
export async function ensureDemoSession(): Promise<string> {
  const jar = await cookies();
  const sessionId = (await verifiedDemoSession(jar.get(DEMO_SESSION_COOKIE)?.value)) ?? crypto.randomUUID();
  jar.set(DEMO_SESSION_COOKIE, await signDemoSession(sessionId, Date.now(), process.env), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: DEMO_SESSION_MAX_AGE_S,
    ...(await demoCookieScopeForRequest()),
  });
  return sessionId;
}

/** "Reset demo data": the visitor's copy is dropped and the cookie with it, so the next read sees the seed again. */
export async function resetDemoSession(vertical: VerticalId): Promise<void> {
  const jar = await cookies();
  const sessionId = await verifiedDemoSession(jar.get(DEMO_SESSION_COOKIE)?.value);
  if (sessionId) resetDemoData(vertical, sessionId);
  jar.delete({ name: DEMO_SESSION_COOKIE, path: "/", ...(await demoCookieScopeForRequest()) });
}
