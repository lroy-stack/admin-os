import { describe, expect, it } from "vitest";

import { DEFAULT_ROLES, permissionsOf, type RoleId } from "@/core/access";
import { type ApprovalPolicy, holdsForApproval } from "@/core/approvals";
import type { ApprovalContext } from "@/core/capability";
import { type Actor, createClient } from "@/core/client";
import { fixedClock } from "@/core/clock";
import { APPROVAL_TTL_MS, createMockAdapter, createSessionStore, MAX_APPROVALS } from "@/core/mock";
import type { Result } from "@/core/result";
import { createSettingsReader } from "@/core/settings";

import { CATALOG } from "./catalog";
import { DEMO, heldWritesFor, MOCK_HANDLERS } from "./demo-kernel";
import { SETTINGS } from "./settings";
import { VERTICALS } from "./vertical";

const START = Date.UTC(2026, 9, 31, 12, 0, 0);
const BOOKING = "R-1046";

const actorOf = (roleId: RoleId): Actor => {
  const role = DEFAULT_ROLES.find((preset) => preset.id === roleId) ?? DEFAULT_ROLES[0];
  return {
    actorId: `demo-${roleId}`,
    roleId,
    permissions: permissionsOf(role, CATALOG, VERTICALS.hospitality.modules),
  };
};

interface SetupOptions {
  readonly policy?: ApprovalPolicy;
  /** A role whose permissions have been taken away since the write was asked for. */
  readonly revokedRole?: string;
}

const setup = ({ policy, revokedRole }: SetupOptions = {}) => {
  const time = { ms: START };
  const store = createSessionStore(DEMO.hospitality.seed);
  const held = heldWritesFor("hospitality");
  const adapter = createMockAdapter({
    handlers: MOCK_HANDLERS,
    store,
    sessionId: "visitor",
    clock: fixedClock(DEMO.hospitality.clock),
    settings: createSettingsReader(SETTINGS, {
      ...VERTICALS.hospitality.settingsDefaults,
      ...(policy === undefined ? {} : { "approvals.policy": policy }),
    }),
    heldWrites: {
      ...held,
      permissionsOfRole: (roleId) => (roleId === revokedRole ? [] : held.permissionsOfRole(roleId)),
    },
    now: () => time.ms,
  });
  const as = (roleId: RoleId, via: ApprovalContext["via"]) =>
    createClient(CATALOG, adapter, {
      actor: actorOf(roleId),
      via,
      retryDelayMs: 0,
      logger: () => undefined,
      mode: "production",
    });
  return { time, as, assistant: as("owner", "mcp"), person: as("owner", "ui") };
};

type Harness = ReturnType<typeof setup>;

const note = (client: Harness["assistant"], text: string) =>
  client.call("bookings.staff_note.add", { id: BOOKING, text }, { idempotencyKey: crypto.randomUUID() });

const cancel = (client: Harness["assistant"], id = BOOKING, reason = "Guest called") =>
  client.call("bookings.cancel", { id, reason });

const idOf = (held: unknown): string => (held as { approvalId: string }).approvalId;

const statusOfBooking = async (client: Harness["person"]) => {
  const fetched = (await client.call("bookings.get", { id: BOOKING })) as Result<{ status: string }>;
  return fetched.ok ? fetched.value.status : fetched.error.code;
};

describe("which writes wait (spec 004, D7)", () => {
  const cases: readonly (readonly [ApprovalPolicy, string, ApprovalContext["via"], boolean])[] = [
    ["destructive_and_sensitive", "bookings.cancel", "mcp", true],
    ["destructive_and_sensitive", "bookings.no_show.mark", "mcp", true],
    ["destructive_and_sensitive", "customers.block", "mcp", true],
    ["destructive_and_sensitive", "bookings.create", "mcp", false],
    ["destructive_and_sensitive", "bookings.staff_note.add", "mcp", false],
    ["destructive_and_sensitive", "bookings.cancel", "ui", false],
    ["destructive_and_sensitive", "bookings.cancel", "system", false],
    ["all", "bookings.create", "mcp", true],
    ["all", "bookings.create", "ui", false],
    ["all", "bookings.list", "mcp", false],
    ["none", "bookings.cancel", "mcp", false],
  ];

  it.each(cases)("under %s, %s via %s waits: %s", (policy, capabilityId, via, waits) => {
    expect(holdsForApproval(policy, CATALOG[capabilityId] ?? CATALOG["clock.get"], via)).toBe(waits);
  });
});

describe("the approvals kernel (AC5)", () => {
  it("holds an assistant's cancel, and a person's approval cancels the booking as the requester", async () => {
    const { assistant, person } = setup();

    const held = await cancel(assistant);
    const waiting = await assistant.call("approvals.get", { approvalId: idOf(held) });
    const untouched = await statusOfBooking(person);
    const approved = await person.call("approvals.approve", { approvalId: idOf(held) });
    const after = await assistant.call("approvals.get", { approvalId: idOf(held) });

    expect([held, waiting, untouched, approved, await statusOfBooking(person)]).toMatchObject([
      { status: "awaiting_approval", approvalId: expect.any(String) },
      { ok: true, value: { status: "pending", capabilityId: "bookings.cancel", requestedByYou: true } },
      "confirmed",
      { ok: true, value: { status: "approved", result: { id: BOOKING, status: "cancelled" } } },
      "cancelled",
    ]);
    expect(after).toMatchObject({
      ok: true,
      value: { status: "approved", result: { id: BOOKING, status: "cancelled" }, decidedAt: expect.any(String) },
    });
  });

  it("never returns the held input from approvals.get", async () => {
    const { assistant } = setup();
    const held = await cancel(assistant, BOOKING, "a private reason");
    expect(JSON.stringify(await assistant.call("approvals.get", { approvalId: idOf(held) }))).not.toContain("private");
  });

  it("answers the same approvalId to a retried hold, and queues one approval", async () => {
    const { assistant, person } = setup();
    const first = await cancel(assistant);
    const retry = await cancel(assistant);
    const listed = await person.call("approvals.list", {});
    expect([idOf(retry), listed]).toMatchObject([idOf(first), { ok: true, value: { items: [{}] } }]);
  });

  it("queues a second approval for a different input", async () => {
    const { assistant, person } = setup();
    await cancel(assistant, BOOKING, "one reason");
    await cancel(assistant, BOOKING, "another reason");
    expect(await person.call("approvals.list", {})).toMatchObject({ ok: true, value: { items: [{}, {}] } });
  });

  it("lists pending first with the input and who asked, and hides what the decider needs not see", async () => {
    const { assistant, person } = setup();
    const rejected = await cancel(assistant, BOOKING, "first");
    await person.call("approvals.reject", { approvalId: idOf(rejected) });
    await cancel(assistant, BOOKING, "second");
    const listed = await person.call("approvals.list", {});
    expect(listed).toMatchObject({
      ok: true,
      value: {
        items: [
          {
            status: "pending",
            capabilityId: "bookings.cancel",
            input: { id: BOOKING, reason: "second" },
            requestedBy: { actorId: "demo-owner", role: "owner", via: "mcp" },
          },
          { status: "rejected" },
        ],
      },
    });
    expect(JSON.stringify(listed)).not.toContain("fingerprint");
  });

  it("expires after 24 hours: the read says so, and approving is refused and runs nothing", async () => {
    const { assistant, person, time } = setup();
    const held = await cancel(assistant);

    time.ms = START + APPROVAL_TTL_MS;
    const read = await assistant.call("approvals.get", { approvalId: idOf(held) });
    const approved = await person.call("approvals.approve", { approvalId: idOf(held) });

    expect([read, approved, await statusOfBooking(person)]).toMatchObject([
      { ok: true, value: { status: "expired" } },
      { ok: false, error: { code: "approvals.expired" } },
      "confirmed",
    ]);
  });

  it("is still pending a moment before the deadline", async () => {
    const { assistant, time } = setup();
    const held = await cancel(assistant);
    time.ms = START + APPROVAL_TTL_MS - 1;
    expect(await assistant.call("approvals.get", { approvalId: idOf(held) })).toMatchObject({
      ok: true,
      value: { status: "pending" },
    });
  });

  it("answers conflict, and records it, when a person changed the booking meanwhile", async () => {
    const { assistant, person } = setup();
    const held = await cancel(assistant, BOOKING, "assistant reason");
    await person.call("bookings.cancel", { id: BOOKING, reason: "person reason" });

    const approved = await person.call("approvals.approve", { approvalId: idOf(held) });
    const read = await assistant.call("approvals.get", { approvalId: idOf(held) });

    expect([approved, read]).toMatchObject([
      { ok: false, error: { code: "approvals.conflict" } },
      { ok: true, value: { status: "conflict", error: { code: "approvals.conflict" } } },
    ]);
    const booking = await person.call("bookings.get", { id: BOOKING });
    expect(booking).toMatchObject({ ok: true, value: { cancelReason: "person reason" } });
  });

  it("refuses a write whose requester no longer holds the permission, and records it", async () => {
    const { assistant, person } = setup({ revokedRole: "owner" });
    const held = await cancel(assistant);

    const approved = await person.call("approvals.approve", { approvalId: idOf(held) });

    expect([approved, await statusOfBooking(person)]).toMatchObject([
      { ok: false, error: { code: "approvals.requester_forbidden" } },
      "confirmed",
    ]);
    expect(await assistant.call("approvals.get", { approvalId: idOf(held) })).toMatchObject({
      ok: true,
      value: { status: "conflict", error: { code: "approvals.requester_forbidden" } },
    });
  });

  it("rejects with a reason the requester sees, and never runs the write", async () => {
    const { assistant, person } = setup();
    const held = await cancel(assistant);

    const rejected = await person.call("approvals.reject", { approvalId: idOf(held), reason: "Guest is on the phone" });
    const read = await assistant.call("approvals.get", { approvalId: idOf(held) });
    const again = await person.call("approvals.approve", { approvalId: idOf(held) });

    expect([rejected, read, again, await statusOfBooking(person)]).toMatchObject([
      { ok: true, value: { status: "rejected" } },
      { ok: true, value: { status: "rejected", reason: "Guest is on the phone", decidedAt: expect.any(String) } },
      { ok: false, error: { code: "approvals.not_pending" } },
      "confirmed",
    ]);
  });

  it.each([
    ["approves", "approvals.approve"],
    ["rejects", "approvals.reject"],
  ] as const)("answers approvals.not_found when a person %s an id that was never issued", async (_label, id) => {
    const { person } = setup();
    expect(await person.call(id, { approvalId: "nope" })).toMatchObject({
      ok: false,
      error: { code: "approvals.not_found" },
    });
  });

  it.each([
    ["owner", true],
    ["manager", true],
    ["staff", false],
  ] as const)("lets the %s decide a held write: %s", async (roleId, allowed) => {
    const { assistant, as } = setup();
    const held = await cancel(assistant);
    const approved = await as(roleId, "ui").call("approvals.approve", { approvalId: idOf(held) });
    expect(approved).toMatchObject(allowed ? { ok: true } : { ok: false, error: { code: "access.forbidden" } });
  });
});

describe("the policy", () => {
  it("lets a cancel run when no write waits", async () => {
    const { assistant } = setup({ policy: "none" });
    expect(await cancel(assistant)).toMatchObject({ ok: true, value: { status: "cancelled" } });
  });

  it("never holds a person's own write", async () => {
    const { person } = setup();
    expect(await cancel(person)).toMatchObject({ ok: true, value: { status: "cancelled" } });
  });

  it("holds even a harmless write when every assistant write waits", async () => {
    const { assistant } = setup({ policy: "all" });
    expect(await note(assistant, "Window seat")).toMatchObject({
      status: "awaiting_approval",
    });
  });

  it("does not hold a harmless write under the default policy", async () => {
    const { assistant } = setup();
    expect(await note(assistant, "Window seat")).toMatchObject({
      ok: true,
    });
  });

  it("changes in the session when the owner sets it, and settings.values.get shows the choice", async () => {
    const { assistant, person } = setup();
    const set = await person.call("approvals.policy.set", { policy: "none" });
    const shown = await person.call("settings.values.get", { keys: ["approvals.policy"] });
    expect([set, shown, await cancel(assistant)]).toMatchObject([
      { ok: true, value: { policy: "none" } },
      { ok: true, value: { values: { "approvals.policy": "none" } } },
      { ok: true, value: { status: "cancelled" } },
    ]);
  });

  it.each(["manager", "staff"] as const)("keeps the policy to the owner: %s is refused", async (roleId) => {
    const { as } = setup();
    expect(await as(roleId, "ui").call("approvals.policy.set", { policy: "none" })).toMatchObject({
      ok: false,
      error: { code: "access.forbidden" },
    });
  });
});

describe("the queue", () => {
  const holdMany = (client: Harness["assistant"], count: number) =>
    Promise.all(Array.from({ length: count }, (_unused, n) => note(client, `note ${n}`)));

  it("refuses a new hold with approvals.queue_full when every record is pending", async () => {
    const { assistant } = setup({ policy: "all" });
    await holdMany(assistant, MAX_APPROVALS);

    expect(await note(assistant, "one too many")).toMatchObject({
      ok: false,
      error: { code: "approvals.queue_full" },
    });
  });

  it("makes room by dropping a decided record, never a pending one", async () => {
    const { assistant, person } = setup({ policy: "all" });
    const held = await holdMany(assistant, MAX_APPROVALS);
    await person.call("approvals.reject", { approvalId: idOf(held[0]) });

    const next = await note(assistant, "fits now");
    const dropped = await assistant.call("approvals.get", { approvalId: idOf(held[0]) });
    const kept = await assistant.call("approvals.get", { approvalId: idOf(held[1]) });

    expect([next, dropped, kept]).toMatchObject([
      { status: "awaiting_approval" },
      { ok: false, error: { code: "approvals.not_found" } },
      { ok: true, value: { status: "pending" } },
    ]);
  });
});

describe("the notification", () => {
  const approvalItems = async (client: Harness["person"]) => {
    const listed = (await client.call("notifications.list", { limit: 100 })) as Result<{
      items: { kind: string }[];
    }>;
    return listed.ok ? listed.value.items.filter((item) => item.kind === "approval.requested") : [];
  };

  it("tells the people who decide that a write waits, until it is decided", async () => {
    const { assistant, person } = setup();
    const held = await cancel(assistant);

    const waiting = await approvalItems(person);
    await person.call("approvals.reject", { approvalId: idOf(held) });
    const decided = await approvalItems(person);

    expect([waiting, decided]).toMatchObject([
      [{ params: { capability: "bookings.cancel", target: BOOKING }, link: { entity: "approval" } }],
      [],
    ]);
  });

  it("does not tell staff, who cannot decide", async () => {
    const { assistant, as } = setup();
    await cancel(assistant);
    expect(await approvalItems(as("staff", "ui"))).toEqual([]);
  });
});
