import { describe, expect, it } from "vitest";
import { z } from "zod";

import { accessCapabilities } from "@/core/access";
import { approvalsCapabilities, approvalsSettings } from "@/core/approvals";
import { type ApprovalContext, defineCapability } from "@/core/capability";
import { type Actor, createClient } from "@/core/client";
import { type BusinessClock, clockCapabilities } from "@/core/clock";
import { ok } from "@/core/result";
import { createSettingsReader, mergeSettings } from "@/core/settings";

import {
  createMockAdapter,
  createSessionStore,
  kernelMockHandlers,
  type MockHandler,
  mockHandler,
  parseFaults,
} from "./index";

/** A write handler changes the session copy in place, so the slice is mutable (the seed itself stays frozen). */
interface Notes {
  readonly notes: string[];
}

const notesList = defineCapability({
  id: "notes.list",
  summary: "List notes.",
  input: z.strictObject({}),
  output: z.array(z.string()),
  permission: "read:notes",
  effect: "read",
  riskTier: 0,
});

const notesAdd = defineCapability({
  id: "notes.add",
  summary: "Add a note.",
  input: z.strictObject({ text: z.string().min(1) }),
  output: z.array(z.string()),
  permission: "create:notes",
  effect: "write",
  riskTier: 2,
});

const catalog = {
  "notes.list": notesList,
  "notes.add": notesAdd,
  ...clockCapabilities,
  ...accessCapabilities,
  ...approvalsCapabilities,
};

const handlers: Readonly<Record<string, MockHandler<Notes>>> = {
  ...mockHandler(notesList, (_input, { data }: { data: Notes }) => ok([...data.notes])),
  ...mockHandler(notesAdd, (input, { data }: { data: Notes }) => {
    data.notes.push(input.text);
    return ok([...data.notes]);
  }),
  ...kernelMockHandlers,
};

const clock: BusinessClock = {
  businessDay: "2026-10-31",
  today: "2026-10-31",
  nowMin: 1240,
  cutoffMin: 300,
  timeZone: "Europe/Madrid",
};

const owner: Actor = {
  actorId: "demo-owner",
  displayName: "Alex Morgan",
  roleId: "owner",
  permissions: ["read:notes", "create:notes", "read:clock", "read:access", "read:approvals"],
};

const reader: Actor = { actorId: "demo-staff", roleId: "staff", permissions: ["read:notes"] };

/** Every assistant write waits for a person; a write from the web app never does. */
const allWrites = createSettingsReader(mergeSettings(...approvalsSettings), { "approvals.policy": "all" });

const setup = (options: { sessionId?: string; faults?: string; actor?: Actor } = {}) => {
  const store = createSessionStore<Notes>({ notes: ["seeded"] });
  const clientFor = (
    sessionId: string | undefined,
    actor: Actor = options.actor ?? owner,
    via: ApprovalContext["via"] = "ui",
  ) =>
    createClient(
      catalog,
      createMockAdapter({
        handlers,
        store,
        sessionId,
        clock,
        settings: allWrites,
        faults: parseFaults(options.faults),
      }),
      { actor, via, retryDelayMs: 0, logger: () => undefined, mode: "production" },
    );
  const assistantFor = (sessionId: string | undefined, actor: Actor = options.actor ?? owner) =>
    clientFor(sessionId, actor, "mcp");
  return { store, client: clientFor(options.sessionId), clientFor, assistantFor };
};

describe("parseFaults", () => {
  it("reads codes and latency, and lets one capability take both", () => {
    expect(
      Object.fromEntries(
        parseFaults("customers.list=customers.not_found, bookings.list=latency:1500,bookings.list=bookings.conflict"),
      ),
    ).toEqual({
      "customers.list": { code: "customers.not_found" },
      "bookings.list": { latencyMs: 1500, code: "bookings.conflict" },
    });
  });

  it.each([undefined, "", " , "])("is empty for %o", (spec) => {
    expect(parseFaults(spec).size).toBe(0);
  });

  it.each(["bookings.list", "bookings=not_found", "bookings.list=latency:fast", "bookings.list=NotFound"])(
    "rejects the malformed entry %s",
    (spec) => {
      expect(() => parseFaults(spec)).toThrow(/MOCK_FAULTS entry/);
    },
  );
});

describe("createSessionStore", () => {
  it("serves the seed to reads without a session and keeps it immutable", () => {
    const store = createSessionStore<Notes>({ notes: ["seeded"] });
    expect(store.read(undefined)).toEqual({ notes: ["seeded"] });
    expect(Object.isFrozen(store.read(undefined).notes)).toBe(true);
  });

  it("evicts the least recently used session beyond the limit", () => {
    const store = createSessionStore<Notes>({ notes: [] }, { maxSessions: 2 });
    store.session("a");
    store.session("b");
    store.read("a");
    store.session("c");
    expect([store.size, store.read("b") === store.read(undefined), store.read("a") === store.read(undefined)]).toEqual([
      2,
      true,
      false,
    ]);
  });

  it("drops a session after its idle TTL", () => {
    const clockMs = { now: 0 };
    const store = createSessionStore<Notes>({ notes: [] }, { ttlMs: 1000, now: () => clockMs.now });
    store.session("a").data;
    clockMs.now = 1001;
    expect(store.read("a")).toBe(store.read(undefined));
  });
});

describe("createMockAdapter", () => {
  it("reads the seed", async () => {
    const { client } = setup();
    expect(await client.call("notes.list", {})).toEqual({ ok: true, value: ["seeded"] });
  });

  it("keeps a visitor's write in their session and away from others", async () => {
    const { clientFor } = setup();
    await clientFor("visitor-a").call("notes.add", { text: "mine" });
    expect([
      await clientFor("visitor-a").call("notes.list", {}),
      await clientFor("visitor-b").call("notes.list", {}),
      await clientFor(undefined).call("notes.list", {}),
    ]).toEqual([
      { ok: true, value: ["seeded", "mine"] },
      { ok: true, value: ["seeded"] },
      { ok: true, value: ["seeded"] },
    ]);
  });

  it("resets a session to the seed", async () => {
    const { store, clientFor } = setup();
    await clientFor("visitor-a").call("notes.add", { text: "mine" });
    store.reset("visitor-a");
    expect(await clientFor("visitor-a").call("notes.list", {})).toEqual({ ok: true, value: ["seeded"] });
  });

  it("refuses a write without a demo session", async () => {
    const { client } = setup();
    expect(await client.call("notes.add", { text: "lost" })).toMatchObject({
      ok: false,
      error: { code: "transport.unavailable" },
    });
  });

  it("returns access.forbidden when the actor lacks the permission", async () => {
    const { clientFor } = setup();
    expect(await clientFor("visitor-a", reader).call("notes.add", { text: "nope" })).toMatchObject({
      ok: false,
      error: { code: "access.forbidden" },
    });
  });

  it("applies a keyed write once and replays its result", async () => {
    const { clientFor } = setup();
    const visitor = clientFor("visitor-a");
    const first = await visitor.call("notes.add", { text: "once" }, { idempotencyKey: "k1" });
    const second = await visitor.call("notes.add", { text: "once" }, { idempotencyKey: "k1" });
    expect([first, second, await visitor.call("notes.list", {})]).toEqual([
      { ok: true, value: ["seeded", "once"] },
      { ok: true, value: ["seeded", "once"] },
      { ok: true, value: ["seeded", "once"] },
    ]);
  });

  it("refuses a key reused with a different input and applies nothing", async () => {
    const { clientFor } = setup();
    const visitor = clientFor("visitor-a");
    await visitor.call("notes.add", { text: "once" }, { idempotencyKey: "k1" });
    const reused = await visitor.call("notes.add", { text: "other" }, { idempotencyKey: "k1" });
    expect([reused, await visitor.call("notes.list", {})]).toMatchObject([
      { ok: false, error: { code: "client.idempotency_conflict" } },
      { ok: true, value: ["seeded", "once"] },
    ]);
  });

  it("applies one keyed write sent five times in parallel once", async () => {
    const { clientFor } = setup();
    const visitor = clientFor("visitor-a");
    await Promise.all(
      Array.from({ length: 5 }, () => visitor.call("notes.add", { text: "once" }, { idempotencyKey: "k1" })),
    );
    expect(await visitor.call("notes.list", {})).toEqual({ ok: true, value: ["seeded", "once"] });
  });

  it("answers a parallel duplicate with another input as an idempotency conflict", async () => {
    const { clientFor } = setup();
    const visitor = clientFor("visitor-a");
    const [first, second] = await Promise.all([
      visitor.call("notes.add", { text: "once" }, { idempotencyKey: "k1" }),
      visitor.call("notes.add", { text: "other" }, { idempotencyKey: "k1" }),
    ]);
    expect([first, second]).toMatchObject([
      { ok: true },
      { ok: false, error: { code: "client.idempotency_conflict" } },
    ]);
  });

  it("holds a write that needs approval and leaves the data alone", async () => {
    const { store, assistantFor } = setup();
    const visitor = assistantFor("visitor-a");
    expect(await visitor.call("notes.add", { text: "!delete all" })).toEqual({
      status: "awaiting_approval",
      approvalId: expect.any(String),
    });
    expect(store.session("visitor-a")).toMatchObject({
      data: { notes: ["seeded"] },
      approvals: [
        {
          capabilityId: "notes.add",
          requestedBy: { actorId: "demo-owner", role: "owner", via: "mcp" },
          status: "pending",
          input: { text: "!delete all" },
        },
      ],
    });
  });

  it("reports a held write's capability and status, and that the caller asked for it", async () => {
    const { assistantFor } = setup();
    const visitor = assistantFor("visitor-a");
    const held = (await visitor.call("notes.add", { text: "!delete all" })) as { approvalId: string };
    expect(await visitor.call("approvals.get", { approvalId: held.approvalId })).toEqual({
      ok: true,
      value: { approvalId: held.approvalId, capabilityId: "notes.add", status: "pending", requestedByYou: true },
    });
  });

  it("never returns the held input", async () => {
    const { assistantFor } = setup();
    const visitor = assistantFor("visitor-a");
    const held = (await visitor.call("notes.add", { text: "!secret" })) as { approvalId: string };
    expect(JSON.stringify(await visitor.call("approvals.get", { approvalId: held.approvalId }))).not.toContain(
      "secret",
    );
  });

  it("tells another actor of the session that the write is not theirs", async () => {
    const { clientFor, assistantFor } = setup();
    const held = (await assistantFor("visitor-a").call("notes.add", { text: "!x" })) as { approvalId: string };
    const colleague: Actor = { ...owner, actorId: "demo-manager" };
    expect(
      await clientFor("visitor-a", colleague).call("approvals.get", { approvalId: held.approvalId }),
    ).toMatchObject({ ok: true, value: { requestedByYou: false } });
  });

  it.each([
    ["an id that was never issued", "visitor-a", "nope"],
    ["a session that holds nothing", undefined, "nope"],
  ])("answers approvals.not_found for %s", async (_label, sessionId, approvalId) => {
    const { clientFor } = setup();
    expect(await clientFor(sessionId).call("approvals.get", { approvalId })).toMatchObject({
      ok: false,
      error: { code: "approvals.not_found" },
    });
  });

  it("does not show one visitor's approval to another session", async () => {
    const { clientFor, assistantFor } = setup();
    const held = (await assistantFor("visitor-a").call("notes.add", { text: "!x" })) as { approvalId: string };
    expect(await clientFor("visitor-b").call("approvals.get", { approvalId: held.approvalId })).toMatchObject({
      ok: false,
      error: { code: "approvals.not_found" },
    });
  });

  it("holds only what an assistant asks for, not what the web app does", async () => {
    const { clientFor, assistantFor } = setup();
    const fromUi = await clientFor("visitor-a").call("notes.add", { text: "mine" });
    const fromMcp = await assistantFor("visitor-b").call("notes.add", { text: "mine" });
    expect([fromUi, fromMcp]).toEqual([
      { ok: true, value: ["seeded", "mine"] },
      { status: "awaiting_approval", approvalId: expect.any(String) },
    ]);
  });

  it("forces a code from MOCK_FAULTS", async () => {
    const { client } = setup({ faults: "notes.list=notes.not_found" });
    expect(await client.call("notes.list", {})).toMatchObject({ ok: false, error: { code: "notes.not_found" } });
  });

  it("forces latency from MOCK_FAULTS, so the client's timeout state is reachable", async () => {
    const store = createSessionStore<Notes>({ notes: [] });
    const slow = createClient(
      catalog,
      createMockAdapter({ handlers, store, clock, faults: parseFaults("notes.list=latency:200") }),
      { actor: owner, timeoutMs: 20, retryDelayMs: 0, logger: () => undefined },
    );
    expect(await slow.call("notes.list", {})).toMatchObject({ ok: false, error: { code: "transport.timeout" } });
  });

  it("answers the kernel capabilities", async () => {
    const { client } = setup();
    expect([await client.call("clock.get", {}), await client.call("access.me.get", {})]).toEqual([
      { ok: true, value: clock },
      {
        ok: true,
        value: { actorId: "demo-owner", displayName: "Alex Morgan", roleId: "owner", permissions: owner.permissions },
      },
    ]);
  });

  it("reports a capability without a handler as unavailable", async () => {
    const lonely = defineCapability({ ...notesList, id: "notes.archive" });
    const store = createSessionStore<Notes>({ notes: [] });
    const client = createClient({ "notes.archive": lonely }, createMockAdapter({ handlers, store, clock }), {
      actor: owner,
      retryDelayMs: 0,
      logger: () => undefined,
    });
    expect(await client.call("notes.archive", {})).toMatchObject({
      ok: false,
      error: { code: "transport.unavailable" },
    });
  });
});
