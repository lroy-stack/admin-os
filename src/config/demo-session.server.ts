import "server-only";

import { cookies } from "next/headers";

import { z } from "zod";

import { resetDemoData } from "./data.server";
import { demoCookieScope } from "./demo-cookie";
import type { VerticalId } from "./vertical";

/**
 * The UI's demo session cookie (ADR 0005). Kept apart from `data.server.ts` so the adapter wiring has no
 * `next/headers` import and the stdio MCP transport can load it outside Next (ADR 0009).
 */

/**
 * httpOnly: only Server Actions and the server read it. The value is signed; the older unsigned `demo_session`
 * cookie is no longer read, so a visitor who still has it starts a fresh session.
 */
export const DEMO_SESSION_COOKIE = "demo_sid";
const DEMO_SESSION_MAX_AGE_S = 2 * 60 * 60;

const secretSchema = z.string().min(32);
let processSecret: string | undefined;

/**
 * The key that signs session ids. With `DATA_STORE=durable` a Durable Object exists per id, so an id nobody signed
 * must never reach it and the secret is required; in memory a per-process one is enough, because the state it
 * guards does not outlive the process either.
 */
function secretOf(env: NodeJS.ProcessEnv): string {
  const configured = env.DEMO_SESSION_SECRET;
  if (configured === undefined || configured === "") {
    if (env.DATA_STORE === "durable") {
      throw new Error(
        "DEMO_SESSION_SECRET is required with DATA_STORE=durable: it signs the demo_session cookie. Generate one with `openssl rand -base64 32` and set it as a secret (`wrangler secret put DEMO_SESSION_SECRET`) or in .dev.vars.",
      );
    }
    processSecret ??= `${crypto.randomUUID()}${crypto.randomUUID()}`;
    return processSecret;
  }
  const parsed = secretSchema.safeParse(configured);
  if (!parsed.success)
    throw new Error("DEMO_SESSION_SECRET must be at least 32 characters; use `openssl rand -base64 32`.");
  return parsed.data;
}

const hmacKey = (usage: KeyUsage) =>
  crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secretOf(process.env)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage],
  );

const toBase64Url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");

const fromBase64Url = (text: string): Uint8Array<ArrayBuffer> | undefined => {
  try {
    return Uint8Array.from(atob(text.replaceAll("-", "+").replaceAll("_", "/")), (char) => char.charCodeAt(0));
  } catch {
    return undefined;
  }
};

const sessionIdSchema = z.uuid();

const cookieValueOf = async (sessionId: string): Promise<string> => {
  const signature = await crypto.subtle.sign("HMAC", await hmacKey("sign"), new TextEncoder().encode(sessionId));
  return `${sessionId}.${toBase64Url(new Uint8Array(signature))}`;
};

/**
 * The session id a `demo_session` cookie carries, or undefined when it is missing, malformed, unsigned or signed
 * with another key: such a visitor has no session and starts a fresh one on the next write.
 */
export async function verifiedDemoSession(cookieValue: string | undefined): Promise<string | undefined> {
  const key = await hmacKey("verify");
  if (cookieValue === undefined) return undefined;
  const [sessionId, signature, ...rest] = cookieValue.split(".");
  if (sessionId === undefined || signature === undefined || rest.length > 0) return undefined;
  const signatureBytes = fromBase64Url(signature);
  if (!sessionIdSchema.safeParse(sessionId).success || signatureBytes === undefined) return undefined;
  const valid = await crypto.subtle.verify("HMAC", key, signatureBytes, new TextEncoder().encode(sessionId));
  return valid ? sessionId : undefined;
}

/** For Server Actions before a write: the visitor's demo session, started on the first write. */
export async function ensureDemoSession(): Promise<string> {
  const jar = await cookies();
  const existing = await verifiedDemoSession(jar.get(DEMO_SESSION_COOKIE)?.value);
  if (existing) return existing;
  const sessionId = crypto.randomUUID();
  jar.set(DEMO_SESSION_COOKIE, await cookieValueOf(sessionId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: DEMO_SESSION_MAX_AGE_S,
    ...demoCookieScope(process.env),
  });
  return sessionId;
}

/** "Reset demo data": the visitor's copy is dropped and the cookie with it, so the next read sees the seed again. */
export async function resetDemoSession(vertical: VerticalId): Promise<void> {
  const jar = await cookies();
  const sessionId = await verifiedDemoSession(jar.get(DEMO_SESSION_COOKIE)?.value);
  if (sessionId) resetDemoData(vertical, sessionId);
  jar.delete({ name: DEMO_SESSION_COOKIE, path: "/", ...demoCookieScope(process.env) });
}
