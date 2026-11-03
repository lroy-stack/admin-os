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

const firstCustomer = { hospitality: "C-iglesias", salon: "client-nora", workshop: "cust-carmen" } as const;

/** Per preset: a confirmed booking that counts as late on the seeded clock, a resource free at `freeAt`, a bookable slot. */
const bookable = {
  hospitality: { booking: "R-1046", resource: "S8", startMin: 22 * 60 },
  salon: { booking: "A-201", resource: "chair-3", startMin: 15 * 60 },
  workshop: { booking: "W-301", resource: "bay-1", startMin: 15 * 60 },
} as const;

/** The smallest valid input of each capability that needs one; the rest accept `{}`. */
const inputFor = (id: string, vertical: VerticalId): Record<string, unknown> => {
  const customer = { id: firstCustomer[vertical] };
  const { booking, resource, startMin } = bookable[vertical];
  const inputs: Record<string, Record<string, unknown>> = {
    "customers.get": customer,
    "customers.create": { name: "Contract Test", phone: "+34611111111" },
    "customers.update": { ...customer, patch: { vip: true } },
    "customers.notes.add": { ...customer, text: "Called back" },
    "customers.block": { ...customer, reason: "No-show twice" },
    "customers.unblock": customer,
    "notifications.read": { ids: [`booking.late:${booking}`] },
    "bookings.availability.get": { businessDay: "2026-10-31", partySize: 2 },
    "bookings.create": {
      businessDay: "2026-10-31",
      startMin,
      partySize: 1,
      resourceIds: [resource],
      contactName: "Contract Test",
      channel: "phone",
    },
    "bookings.update": { id: booking, patch: { staffNote: "Checked" } },
    "bookings.status.advance": { id: booking, to: "in_progress" },
    "bookings.status.undo": { id: booking },
    "bookings.cancel": { id: booking, reason: "Guest called" },
    "bookings.no_show.mark": { id: booking },
    "bookings.walk_in.seat": { partySize: 1, resourceIds: [resource] },
    "bookings.walk_in.undo": { id: "bk-undo" },
  };
  return inputs[id] ?? {};
};

/** Undo needs a walk-in seated a moment ago, so the contract test seats one in the same session first. */
const seatedWalkIn = async (client: ReturnType<typeof createClient>, vertical: VerticalId) => {
  const seated = await client.call("bookings.walk_in.seat", inputFor("bookings.walk_in.seat", vertical), {
    idempotencyKey: crypto.randomUUID(),
  });
  return { id: "ok" in seated && seated.ok ? (seated.value as { id: string }).id : "seat-failed" };
};

/** A status step to take back: advance the booking first, as the capability needs a step on record. */
const advancedBooking = async (client: ReturnType<typeof createClient>, vertical: VerticalId) => {
  await client.call("bookings.status.advance", inputFor("bookings.status.advance", vertical), {
    idempotencyKey: crypto.randomUUID(),
  });
  return inputFor("bookings.status.undo", vertical);
};

const inputBeforeCall = (client: ReturnType<typeof createClient>, id: string, vertical: VerticalId) => {
  if (id === "bookings.walk_in.undo") return seatedWalkIn(client, vertical);
  if (id === "bookings.status.undo") return advancedBooking(client, vertical);
  return Promise.resolve(inputFor(id, vertical));
};

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
      const client = createClient(CATALOG, getAdapter({ vertical, sessionId: crypto.randomUUID() }), {
        ...quiet,
        actor: ownerOf(vertical),
        mode: "development",
      });
      const input = await inputBeforeCall(client, id, vertical);
      expect(await client.call(id, input, { idempotencyKey: crypto.randomUUID() })).toMatchObject({ ok: true });
    });

    it.each(capabilityIds)("answers %s with access.forbidden for an actor without permissions", async (id) => {
      const client = createClient(CATALOG, getAdapter({ vertical }), { ...quiet });
      expect(await client.call(id, inputFor(id, vertical), { idempotencyKey: crypto.randomUUID() })).toMatchObject({
        ok: false,
        error: { code: "access.forbidden" },
      });
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
