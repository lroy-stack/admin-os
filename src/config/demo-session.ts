import { z } from "zod";

import { type RoleId, roleIdSchema } from "@/core/access";

/**
 * The demo visitor's cookies (ADR 0005, 0016 D4), without Next: the web app reads and writes them through
 * `demo-session.server.ts`, and the MCP Worker's consent page verifies and starts the same signed session, so a grant
 * acts on the visitor's own demo data.
 */

/**
 * httpOnly: only Server Actions and the server read it. The value is signed and carries its issue time; the older
 * unsigned `demo_session` cookie is no longer read, so a visitor who still has it starts a fresh session.
 */
export const DEMO_SESSION_COOKIE = "demo_sid";
export const DEMO_SESSION_MAX_AGE_S = 2 * 60 * 60;

/** Demo switch (ADR 0006): which role preset the visitor acts as. */
export const DEMO_ROLE_COOKIE = "demo_role";

const roleSchema = roleIdSchema.catch("owner");

/** The visitor's role from the `demo_role` cookie; a missing or malformed value is the owner, as the UI shows it. */
export const demoRoleOf = (cookieValue: string | undefined): RoleId => roleSchema.parse(cookieValue);

/** The variables the session reads: `process.env` in the web app, the Worker's `env` in the MCP Worker. */
export type DemoSessionEnv = Readonly<Record<string, string | undefined>>;

const secretSchema = z.string().min(32);
let processSecret: string | undefined;

/**
 * The key that signs session ids. With `DATA_STORE=durable` a Durable Object exists per id, so an id nobody signed
 * must never reach it and the secret is required; in memory a per-process one is enough, because the state it
 * guards does not outlive the process either.
 */
function secretOf(env: DemoSessionEnv): string {
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
const hmacKey = (env: DemoSessionEnv): Promise<CryptoKey> => {
  const secret = secretOf(env);
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
export async function signDemoSession(sessionId: string, now: number, env: DemoSessionEnv): Promise<string> {
  const issuedAt = String(Math.floor(now / 1000));
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(env), payloadOf(sessionId, issuedAt));
  return `${sessionId}.${issuedAt}.${toBase64Url(new Uint8Array(signature))}`;
}

/**
 * The session id a `demo_sid` cookie carries, or undefined when it is missing, malformed, unsigned, signed with
 * another key or older than the session's lifetime: such a visitor has no session and starts a fresh one.
 */
export async function verifyDemoSession(
  cookieValue: string | undefined,
  now: number,
  env: DemoSessionEnv,
): Promise<string | undefined> {
  const key = await hmacKey(env);
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

/** JSON keeps the parts apart, whatever they contain; the first part names the purpose, so no signature serves two. */
const valuePayloadOf = (parts: readonly string[]): Uint8Array<ArrayBuffer> =>
  new TextEncoder().encode(JSON.stringify(["v1", ...parts]));

/**
 * HMAC-SHA-256 (base64url) of `parts` under the session secret, for values the demo hands a browser and must read
 * back unchanged, such as the role and client name a consent page showed.
 */
export async function signDemoValue(parts: readonly string[], env: DemoSessionEnv): Promise<string> {
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(env), valuePayloadOf(parts));
  return toBase64Url(new Uint8Array(signature));
}

/** Whether `signature` is `signDemoValue(parts)` under the current secret. */
export async function verifyDemoValue(
  parts: readonly string[],
  signature: string,
  env: DemoSessionEnv,
): Promise<boolean> {
  const key = await hmacKey(env);
  const bytes = fromBase64Url(signature);
  return bytes !== undefined && crypto.subtle.verify("HMAC", key, bytes, valuePayloadOf(parts));
}
