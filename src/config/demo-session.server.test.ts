import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DEMO_SESSION_COOKIE,
  DEMO_SESSION_MAX_AGE_S,
  ensureDemoSession,
  resetDemoSession,
  verifiedDemoSession,
} from "./demo-session.server";

/** An in-memory stand-in for `cookies()`; `set` and `delete` are observed so tests can check what the server writes. */
const jar = vi.hoisted(() => {
  const values = new Map<string, string>();
  return {
    values,
    host: "localhost:3000",
    get: (name: string) => (values.has(name) ? { name, value: values.get(name) } : undefined),
    set: vi.fn((name: string, value: string) => values.set(name, value)),
    delete: vi.fn((options: { name: string }) => values.delete(options.name)),
  };
});

vi.mock("next/headers", () => ({
  cookies: async () => jar,
  headers: async () => new Headers({ host: jar.host }),
}));

const SECRET = "0123456789abcdef0123456789abcdef";
const ID = "6f1c2a9e-3b0d-4c1e-8f6a-1d2e3f4a5b6c";

beforeEach(() => {
  jar.values.clear();
  jar.host = "localhost:3000";
  jar.set.mockClear();
  jar.delete.mockClear();
  vi.stubEnv("DEMO_SESSION_SECRET", SECRET);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

/** The cookie a first write sets, signed with the current secret. */
const startedCookie = async () => {
  const sessionId = await ensureDemoSession();
  return { sessionId, cookie: jar.values.get(DEMO_SESSION_COOKIE) as string };
};

describe("ensureDemoSession", () => {
  it("starts an httpOnly signed session cookie on the first write", async () => {
    const sessionId = await ensureDemoSession();
    expect(jar.set).toHaveBeenCalledWith(
      DEMO_SESSION_COOKIE,
      expect.stringMatching(new RegExp(`^${sessionId}\\.[0-9]+\\.[A-Za-z0-9_-]+$`)),
      { httpOnly: true, sameSite: "lax", path: "/", maxAge: 7200 },
    );
  });

  it("shares the cookie with the domain's subdomains on the domain's own host", async () => {
    vi.stubEnv("DEMO_COOKIE_DOMAIN", "admin-os.lr0y.dev");
    jar.host = "admin-os.lr0y.dev";
    await ensureDemoSession();
    expect(jar.set).toHaveBeenCalledWith(
      DEMO_SESSION_COOKIE,
      expect.any(String),
      expect.objectContaining({ domain: "admin-os.lr0y.dev", secure: true }),
    );
  });

  it("keeps the cookie host-only on localhost even when the domain is configured", async () => {
    vi.stubEnv("DEMO_COOKIE_DOMAIN", "admin-os.lr0y.dev");
    await ensureDemoSession();
    expect(jar.set).toHaveBeenCalledWith(DEMO_SESSION_COOKIE, expect.any(String), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7200,
    });
  });

  it("ignores the unsigned demo_session cookie of earlier visits", async () => {
    jar.values.set("demo_session", ID);
    const sessionId = await ensureDemoSession();
    expect(sessionId).not.toBe(ID);
  });

  it("keeps the visitor's session id and renews the cookie on every write", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-04T10:00:00Z"));
    const { sessionId, cookie } = await startedCookie();
    vi.setSystemTime(new Date("2026-11-04T11:00:00Z"));

    const again = await ensureDemoSession();

    expect([again, jar.values.get(DEMO_SESSION_COOKIE) === cookie]).toEqual([sessionId, false]);
  });

  it("lets a renewed cookie outlive the first one's two hours", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-04T10:00:00Z"));
    const { sessionId } = await startedCookie();
    vi.setSystemTime(new Date("2026-11-04T11:30:00Z"));
    await ensureDemoSession();
    vi.setSystemTime(new Date("2026-11-04T13:00:00Z"));

    expect(await verifiedDemoSession(jar.values.get(DEMO_SESSION_COOKIE))).toBe(sessionId);
  });

  it("starts a fresh session for a cookie signed with another secret", async () => {
    const { sessionId } = await startedCookie();
    vi.stubEnv("DEMO_SESSION_SECRET", "another-secret-another-secret-another");
    expect(await ensureDemoSession()).not.toBe(sessionId);
  });

  it("works in memory without a configured secret", async () => {
    vi.stubEnv("DEMO_SESSION_SECRET", "");
    const { sessionId } = await startedCookie();
    expect(await verifiedDemoSession(jar.values.get(DEMO_SESSION_COOKIE))).toBe(sessionId);
  });

  it("fails fast with an actionable message when the durable store has no secret", async () => {
    vi.stubEnv("DEMO_SESSION_SECRET", "");
    vi.stubEnv("DATA_STORE", "durable");
    await expect(ensureDemoSession()).rejects.toThrow(/DEMO_SESSION_SECRET is required.*openssl rand/);
  });

  it("fails fast on a read when the durable store has no secret", async () => {
    vi.stubEnv("DEMO_SESSION_SECRET", "");
    vi.stubEnv("DATA_STORE", "durable");
    await expect(verifiedDemoSession(undefined)).rejects.toThrow(/DEMO_SESSION_SECRET is required/);
  });

  it("rejects a secret shorter than 32 characters", async () => {
    vi.stubEnv("DEMO_SESSION_SECRET", "short");
    await expect(ensureDemoSession()).rejects.toThrow(/at least 32 characters/);
  });
});

describe("verifiedDemoSession", () => {
  it("returns the id of a cookie this server signed", async () => {
    const { sessionId, cookie } = await startedCookie();
    expect(await verifiedDemoSession(cookie)).toBe(sessionId);
  });

  it.each([
    ["missing", undefined],
    ["unsigned", ID],
    ["without an issue time", `${ID}.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`],
    ["forged", `${ID}.1793000000.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`],
    ["not base64", `${ID}.1793000000.%%%`],
    ["not a uuid", "admin.1793000000.AAAA"],
    ["with a non-numeric issue time", `${ID}.soon.AAAA`],
    ["four parts", "a.b.c.d"],
    ["empty", ""],
  ])("treats a %s cookie as no session", async (_label, cookie) => {
    expect(await verifiedDemoSession(cookie)).toBeUndefined();
  });

  it("treats a signature moved onto another id as forged", async () => {
    const { cookie } = await startedCookie();
    const [, issuedAt, signature] = cookie.split(".");
    expect(await verifiedDemoSession(`${ID}.${issuedAt}.${signature}`)).toBeUndefined();
  });

  it("treats a changed issue time as forged", async () => {
    const { sessionId, cookie } = await startedCookie();
    const [, issuedAt, signature] = cookie.split(".");
    expect(await verifiedDemoSession(`${sessionId}.${Number(issuedAt) + 1}.${signature}`)).toBeUndefined();
  });

  it("rejects a genuine cookie older than the session's lifetime", async () => {
    const { cookie } = await startedCookie();
    const later = Date.now() + (DEMO_SESSION_MAX_AGE_S + 1) * 1000;
    expect(await verifiedDemoSession(cookie, later)).toBeUndefined();
  });

  it("accepts a genuine cookie just inside the session's lifetime", async () => {
    const { sessionId, cookie } = await startedCookie();
    const later = Date.now() + (DEMO_SESSION_MAX_AGE_S - 5) * 1000;
    expect(await verifiedDemoSession(cookie, later)).toBe(sessionId);
  });
});

describe("resetDemoSession", () => {
  it("drops the visitor's cookie so the next read sees the seed", async () => {
    await startedCookie();
    await resetDemoSession("hospitality");
    expect([jar.delete.mock.calls, jar.values.has(DEMO_SESSION_COOKIE)]).toEqual([
      [[{ name: DEMO_SESSION_COOKIE, path: "/" }]],
      false,
    ]);
  });

  it("drops the domain-scoped cookie on the domain's host", async () => {
    vi.stubEnv("DEMO_COOKIE_DOMAIN", "admin-os.lr0y.dev");
    jar.host = "admin-os.lr0y.dev";
    await startedCookie();
    await resetDemoSession("hospitality");
    expect(jar.delete).toHaveBeenCalledWith({
      name: DEMO_SESSION_COOKIE,
      path: "/",
      domain: "admin-os.lr0y.dev",
      secure: true,
    });
  });
});
