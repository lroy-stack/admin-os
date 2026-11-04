import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEMO_SESSION_COOKIE, ensureDemoSession, resetDemoSession, verifiedDemoSession } from "./demo-session.server";

/** An in-memory stand-in for `cookies()`; `set` and `delete` are observed so tests can check what the server writes. */
const jar = vi.hoisted(() => {
  const values = new Map<string, string>();
  return {
    values,
    get: (name: string) => (values.has(name) ? { name, value: values.get(name) } : undefined),
    set: vi.fn((name: string, value: string) => values.set(name, value)),
    delete: vi.fn((options: { name: string }) => values.delete(options.name)),
  };
});

vi.mock("next/headers", () => ({ cookies: async () => jar }));

const SECRET = "0123456789abcdef0123456789abcdef";

beforeEach(() => {
  jar.values.clear();
  jar.set.mockClear();
  jar.delete.mockClear();
  vi.stubEnv("DEMO_SESSION_SECRET", SECRET);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

/** The cookie a first write sets, signed with the current secret. */
const startedCookie = async () => {
  const sessionId = await ensureDemoSession();
  return { sessionId, cookie: jar.values.get(DEMO_SESSION_COOKIE) as string };
};

describe("ensureDemoSession", () => {
  it("starts an httpOnly signed session cookie on the first write", async () => {
    const sessionId = await ensureDemoSession();
    expect(jar.set).toHaveBeenCalledWith(DEMO_SESSION_COOKIE, expect.stringMatching(new RegExp(`^${sessionId}\\.`)), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7200,
    });
  });

  it("shares the cookie with the domain's subdomains when DEMO_COOKIE_DOMAIN is set", async () => {
    vi.stubEnv("DEMO_COOKIE_DOMAIN", "admin-os.lr0y.dev");
    await ensureDemoSession();
    expect(jar.set).toHaveBeenCalledWith(
      DEMO_SESSION_COOKIE,
      expect.any(String),
      expect.objectContaining({ domain: "admin-os.lr0y.dev" }),
    );
  });

  it("ignores the unsigned demo_session cookie of earlier visits", async () => {
    jar.values.set("demo_session", "6f1c2a9e-3b0d-4c1e-8f6a-1d2e3f4a5b6c");
    await ensureDemoSession();
    expect(jar.set).toHaveBeenCalledWith(DEMO_SESSION_COOKIE, expect.any(String), expect.any(Object));
  });

  it("keeps the session the visitor already has", async () => {
    const { sessionId } = await startedCookie();
    jar.set.mockClear();
    expect([await ensureDemoSession(), jar.set.mock.calls.length]).toEqual([sessionId, 0]);
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
    ["unsigned", "6f1c2a9e-3b0d-4c1e-8f6a-1d2e3f4a5b6c"],
    ["forged", "6f1c2a9e-3b0d-4c1e-8f6a-1d2e3f4a5b6c.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"],
    ["not base64", "6f1c2a9e-3b0d-4c1e-8f6a-1d2e3f4a5b6c.%%%"],
    ["not a uuid", "admin.AAAA"],
    ["three parts", "a.b.c"],
    ["empty", ""],
  ])("treats a %s cookie as no session", async (_label, cookie) => {
    expect(await verifiedDemoSession(cookie)).toBeUndefined();
  });

  it("treats a signature moved onto another id as forged", async () => {
    const { cookie } = await startedCookie();
    const signature = cookie.split(".")[1];
    expect(await verifiedDemoSession(`6f1c2a9e-3b0d-4c1e-8f6a-1d2e3f4a5b6c.${signature}`)).toBeUndefined();
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

  it("drops the domain-scoped cookie when DEMO_COOKIE_DOMAIN is set", async () => {
    vi.stubEnv("DEMO_COOKIE_DOMAIN", "admin-os.lr0y.dev");
    await startedCookie();
    await resetDemoSession("hospitality");
    expect(jar.delete).toHaveBeenCalledWith({ name: DEMO_SESSION_COOKIE, path: "/", domain: "admin-os.lr0y.dev" });
  });
});
