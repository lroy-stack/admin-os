import "server-only";

import { cookies, headers } from "next/headers";

import { z } from "zod";

import { resetDemoData } from "./data.server";
import { demoCookieScope } from "./demo-cookie";
import type { VerticalId } from "./vertical";

/**
 * The UI's demo session cookie (ADR 0005). Kept apart from `data.server.ts` so the adapter wiring has no
 * `next/headers` import and the stdio MCP transport can load it outside Next (ADR 0009).
 */

/**
 * httpOnly: only Server Actions and the server read it. The value is signed and carries its issue time; the older
 * unsigned `demo_session` cookie is no longer read, so a visitor who still has it starts a fresh session.
 */
export const DEMO_SESSION_COOKIE = "demo_sid";
export const DEMO_SESSION_MAX_AGE_S = 2 * 60 * 60;

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
        "DEMO_SESSION_SECRET is required with DATA_STORE=durable: it signs the demo_sid cookie. Generate one with `openssl rand -base64 32` and set it as a secret (`wrangler secret put DEMO_SESSION_SECRET`) or in .dev.vars.",
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

const keys = new Map<string, Promise<CryptoKey>>();

/** The HMAC key of the current secret, imported once per secret. */
const hmacKey = (): Promise<CryptoKey> => {
  const secret = secretOf(process.env);
  let key = keys.get(secret);
  if (key === undefined) {
    key = crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
      "sign",
      "verify",
    ]);
    keys.set(secret, key);
  }
  return key;
};

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
const issuedAtSchema = z.string().regex(/^[0-9]{1,12}$/);
/** Clock skew a cookie may show between the instance that issued it and the one that reads it. */
const SKEW_S = 60;

/** What the signature covers: a version and the cookie's name keep a signature from serving another purpose. */
const payloadOf = (sessionId: string, issuedAt: string): Uint8Array<ArrayBuffer> =>
  new TextEncoder().encode(`v1|${DEMO_SESSION_COOKIE}|${sessionId}|${issuedAt}`);

/** `<session id>.<issued at, epoch seconds>.<HMAC-SHA-256 of the payload>`. */
const cookieValueOf = async (sessionId: string, now: number): Promise<string> => {
  const issuedAt = String(Math.floor(now / 1000));
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(), payloadOf(sessionId, issuedAt));
  return `${sessionId}.${issuedAt}.${toBase64Url(new Uint8Array(signature))}`;
};

/**
 * The session id a `demo_sid` cookie carries, or undefined when it is missing, malformed, unsigned, signed with
 * another key or older than the session's lifetime: such a visitor has no session and starts a fresh one on the next
 * write.
 */
export async function verifiedDemoSession(
  cookieValue: string | undefined,
  now: number = Date.now(),
): Promise<string | undefined> {
  const key = await hmacKey();
  if (cookieValue === undefined) return undefined;
  const [sessionId, issuedAt, signature, ...rest] = cookieValue.split(".");
  if (sessionId === undefined || issuedAt === undefined || signature === undefined || rest.length > 0) return undefined;
  const signatureBytes = fromBase64Url(signature);
  if (
    !sessionIdSchema.safeParse(sessionId).success ||
    !issuedAtSchema.safeParse(issuedAt).success ||
    signatureBytes === undefined
  ) {
    return undefined;
  }
  const ageS = Math.floor(now / 1000) - Number(issuedAt);
  if (ageS > DEMO_SESSION_MAX_AGE_S || ageS < -SKEW_S) return undefined;
  const valid = await crypto.subtle.verify("HMAC", key, signatureBytes, payloadOf(sessionId, issuedAt));
  return valid ? sessionId : undefined;
}

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
  jar.set(DEMO_SESSION_COOKIE, await cookieValueOf(sessionId, Date.now()), {
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
