import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_ROLES, permissionsOf } from "@/core/access";
import { type Actor, createClient } from "@/core/client";

import { CATALOG } from "./catalog";
import { getAdapter, MOCK_HANDLERS } from "./data.server";
import { DEMO_SESSION_COOKIE, ensureDemoSession } from "./demo-session.server";
import { DEMO_ROLE_COOKIE, getRuntime, MOCK_FAULTS_COOKIE } from "./runtime";
import { VERTICALS, type VerticalId } from "./vertical";

/** An in-memory stand-in for `cookies()`; `set` is observed so tests can check the attributes. */
const jar = vi.hoisted(() => {
  const values = new Map<string, string>();
  return {
    values,
    get: (name: string) => (values.has(name) ? { name, value: values.get(name) } : undefined),
    set: vi.fn((name: string, value: string) => values.set(name, value)),
  };
});

vi.mock("next/headers", () => ({
  cookies: async () => jar,
  headers: async () => new Headers({ "accept-language": "en" }),
}));

beforeEach(() => {
  jar.values.clear();
  jar.set.mockClear();
});

const verticalIds = Object.keys(VERTICALS) as VerticalId[];
const capabilityIds = Object.keys(CATALOG);
const quiet = { retryDelayMs: 0, logger: () => undefined } as const;

const ownerOf = (vertical: VerticalId): Actor => ({
  actorId: "demo-owner",
  roleId: "owner",
  permissions: permissionsOf(DEFAULT_ROLES[0], CATALOG, VERTICALS[vertical].modules),
});

describe("the mock adapter contract (ADR 0008)", () => {
  it.each(capabilityIds)("%s has a mock handler", (id) => {
    expect(MOCK_HANDLERS).toHaveProperty([id]);
  });

  describe.each(verticalIds)("%s", (vertical) => {
    const enabled = new Set<string>([...VERTICALS[vertical].modules, "access", "clock"]);
    const reachable = capabilityIds.filter((id) => enabled.has(id.split(".")[0] ?? ""));

    it.each(reachable)("answers %s with output that matches its schema", async (id) => {
      // Development mode throws on contract drift, so a seed or handler that breaks the schema fails here.
      const client = createClient(CATALOG, getAdapter({ vertical }), {
        ...quiet,
        actor: ownerOf(vertical),
        mode: "development",
      });
      expect(await client.call(id, {})).toMatchObject({ ok: true });
    });

    it.each(capabilityIds)("answers %s with access.forbidden for an actor without permissions", async (id) => {
      const client = createClient(CATALOG, getAdapter({ vertical }), { ...quiet });
      expect(await client.call(id, {})).toMatchObject({ ok: false, error: { code: "access.forbidden" } });
    });
  });
});

describe("ensureDemoSession", () => {
  it("starts an httpOnly session cookie on the first write", async () => {
    const sessionId = await ensureDemoSession();
    expect(jar.set).toHaveBeenCalledWith(DEMO_SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7200,
    });
  });

  it("keeps the session the visitor already has", async () => {
    jar.values.set(DEMO_SESSION_COOKIE, "existing");
    expect([await ensureDemoSession(), jar.set.mock.calls.length]).toEqual(["existing", 0]);
  });
});

describe("getRuntime", () => {
  it.each([
    [undefined, "owner"],
    ["staff", "staff"],
    ["manager", "manager"],
    ["superuser", "owner"],
  ])("acts as the role in the demo cookie %s (%s)", async (cookie, roleId) => {
    jar.values.set(DEMO_ROLE_COOKIE, cookie ?? "");
    const { actor } = await getRuntime();
    expect(actor.roleId).toBe(roleId);
  });

  it("forces a visitor's fault from the demo cookie", async () => {
    jar.values.set(MOCK_FAULTS_COOKIE, "bookings.list=bookings.not_found");
    const { client } = await getRuntime();
    expect(await client.call("bookings.list", {})).toMatchObject({
      ok: false,
      error: { code: "bookings.not_found" },
    });
  });

  it("ignores a malformed fault cookie instead of failing the page", async () => {
    jar.values.set(MOCK_FAULTS_COOKIE, "nonsense");
    const { client } = await getRuntime();
    expect(await client.call("bookings.list", {})).toMatchObject({ ok: true });
  });
});
