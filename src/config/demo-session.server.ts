import "server-only";

import { cookies } from "next/headers";

import { resetDemoData } from "./data.server";
import type { VerticalId } from "./vertical";

/**
 * The UI's demo session cookie (ADR 0005). Kept apart from `data.server.ts` so the adapter wiring has no
 * `next/headers` import and the stdio MCP transport can load it outside Next (ADR 0009).
 */

/** httpOnly: only Server Actions and the server read it. */
export const DEMO_SESSION_COOKIE = "demo_session";
const DEMO_SESSION_MAX_AGE_S = 2 * 60 * 60;

/** For Server Actions before a write: the visitor's demo session, started on the first write. */
export async function ensureDemoSession(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(DEMO_SESSION_COOKIE)?.value;
  if (existing) return existing;
  const sessionId = crypto.randomUUID();
  jar.set(DEMO_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: DEMO_SESSION_MAX_AGE_S,
  });
  return sessionId;
}

/** "Reset demo data": the visitor's copy is dropped, so the next read sees the seed again. */
export async function resetDemoSession(vertical: VerticalId): Promise<void> {
  const sessionId = (await cookies()).get(DEMO_SESSION_COOKIE)?.value;
  if (sessionId) resetDemoData(vertical, sessionId);
}
