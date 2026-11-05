import { describe, expect, it } from "vitest";

import type { Result } from "@/core/result";

import {
  type Harness,
  heldThroughMcp,
  idOf,
  itAppliesOnceWhenApprovedTwiceInOneTick,
  itHoldsAsThePolicySays,
  setup,
} from "./approvals.testkit";

/** What the approval mechanism does with the `bookings` module's writes (ADR 0017 §7; the mechanism is in approvals.test.ts). */
const BOOKING = "R-1046";

const note = (client: Harness["assistant"], text: string) =>
  client.call("bookings.staff_note.add", { id: BOOKING, text }, { idempotencyKey: crypto.randomUUID() });

const cancel = (client: Harness["assistant"], id = BOOKING, reason = "Guest called") =>
  client.call("bookings.cancel", { id, reason });

const statusOfBooking = async (client: Harness["person"]) => {
  const fetched = (await client.call("bookings.get", { id: BOOKING })) as Result<{ status: string }>;
  return fetched.ok ? fetched.value.status : fetched.error.code;
};

describe("which bookings writes wait (spec 004, D7)", () => {
  itHoldsAsThePolicySays([
    ["destructive_and_sensitive", "bookings.cancel", "mcp", true],
    ["destructive_and_sensitive", "bookings.no_show.mark", "mcp", true],
    ["destructive_and_sensitive", "bookings.create", "mcp", false],
    ["destructive_and_sensitive", "bookings.staff_note.add", "mcp", false],
    ["destructive_and_sensitive", "bookings.cancel", "ui", false],
    ["destructive_and_sensitive", "bookings.cancel", "system", false],
    ["all", "bookings.create", "mcp", true],
    ["all", "bookings.create", "ui", false],
    ["all", "bookings.list", "mcp", false],
    ["none", "bookings.cancel", "mcp", false],
  ]);
});

describe("holding and deciding a booking write (AC5)", () => {
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

  it.each(["owner", "manager"] as const)("lets the %s approve a held write", async (roleId) => {
    const { assistant, as } = setup();
    const held = await cancel(assistant);
    expect(await as(roleId, "ui").call("approvals.approve", { approvalId: idOf(held) })).toMatchObject({ ok: true });
  });

  it("keeps two actors' identical requests apart, and the second is a conflict once the first applies", async () => {
    const { assistant, as, person } = setup();
    const first = await cancel(assistant);
    const second = await cancel(as("manager", "mcp"));

    const approvedFirst = await person.call("approvals.approve", { approvalId: idOf(first) });
    const approvedSecond = await person.call("approvals.approve", { approvalId: idOf(second) });

    expect([idOf(second) === idOf(first), approvedFirst, approvedSecond]).toMatchObject([
      false,
      { ok: true },
      { ok: false, error: { code: "approvals.conflict" } },
    ]);
  });
});

describe("deciding a booking write at the same moment", () => {
  itAppliesOnceWhenApprovedTwiceInOneTick([
    {
      label: "bookings.cancel",
      policy: "destructive_and_sensitive",
      hold: (assistant) => cancel(assistant),
      applied: async (person) => ({ cancelled: await statusOfBooking(person) }),
      expected: { cancelled: "cancelled" },
    },
    {
      label: "bookings.staff_note.add",
      policy: "all",
      hold: (assistant) => note(assistant, "Window seat"),
      applied: async (person) => {
        const fetched = (await person.call("bookings.get", { id: BOOKING })) as Result<{ staffNote?: string }>;
        return { times: fetched.ok ? (fetched.value.staffNote ?? "").split("Window seat").length - 1 : -1 };
      },
      expected: { times: 1 },
    },
  ]);
});

describe("what moved since the write was asked for", () => {
  it("approves a cancel although someone added a staff note to the same booking meanwhile", async () => {
    const { assistant, person } = setup();
    const held = await cancel(assistant);
    await person.call("bookings.staff_note.add", { id: BOOKING, text: "Seen" }, { idempotencyKey: "k-note" });

    expect(await person.call("approvals.approve", { approvalId: idOf(held) })).toMatchObject({
      ok: true,
      value: { status: "approved" },
    });
  });

  it("approves a cancel although the party size of the booking changed meanwhile", async () => {
    const { assistant, person } = setup();
    const held = await cancel(assistant);
    await person.call("bookings.reschedule", { id: BOOKING, partySize: 1 });

    expect(await person.call("approvals.approve", { approvalId: idOf(held) })).toMatchObject({
      ok: true,
      value: { status: "approved" },
    });
  });

  it("answers the write's own rule when it can no longer run: a booking approved after its start (D3)", async () => {
    const asked = setup({ policy: "all" });
    const held = await asked.assistant.call(
      "bookings.create",
      {
        businessDay: "2026-10-31",
        startMin: 22 * 60,
        partySize: 1,
        resourceIds: ["S8"],
        customerId: "C-iglesias",
        channel: "phone",
      },
      { idempotencyKey: "d3-late" },
    );
    const later = setup({ policy: "all", store: asked.store, nowMin: 22 * 60 + 15 });

    expect([held, await later.person.call("approvals.approve", { approvalId: idOf(held) })]).toMatchObject([
      { status: "awaiting_approval" },
      { ok: false, error: { code: "bookings.start_passed" } },
    ]);
  });

  it("answers conflict when the booking lost its table meanwhile", async () => {
    const { assistant, person } = setup();
    const held = await cancel(assistant);
    await person.call("bookings.table.assign", { id: BOOKING, resourceIds: ["S8"] });

    expect(await person.call("approvals.approve", { approvalId: idOf(held) })).toMatchObject({
      ok: false,
      error: { code: "approvals.conflict" },
    });
  });
});

describe("what the default policy holds of bookings through MCP (AC5, pinned)", () => {
  it("is exactly these four writes; a change to the list is a decision, not an accident", () => {
    expect(heldThroughMcp("bookings")).toEqual([
      "bookings.cancel",
      "bookings.no_show.mark",
      "bookings.reschedule",
      "bookings.table.assign",
    ]);
  });
});

describe("the policy on a booking write", () => {
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
});
