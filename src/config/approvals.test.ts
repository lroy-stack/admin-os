import { describe, expect, it } from "vitest";

import { APPROVAL_TTL_MS, policyOf } from "@/core/approvals";
import type { Actor } from "@/core/client";
import { MAX_APPROVALS } from "@/core/mock";
import type { Result } from "@/core/result";
import { createSettingsReader } from "@/core/settings";

import {
  actorOf,
  type Harness,
  heldThroughMcp,
  idOf,
  itAppliesOnceWhenApprovedTwiceInOneTick,
  itHoldsAsThePolicySays,
  START,
  setup,
} from "./approvals.testkit";
import { MODULES } from "./modules.generated";

/**
 * The approval mechanism, on the one write the kernel owns that the default policy holds through MCP:
 * `settings.values.update`. The cases about a module's own writes live in `approvals.<module>.test.ts` (ADR 0017 §7).
 */
const SETTING = "business.payment";
const paymentAt = (bank: string) => ({ accountHolder: "Test Business", accountNumber: "ES0000000000", bank });

const change = (client: Harness["assistant"], bank = "Bank A") =>
  client.call("settings.values.update", { values: { [SETTING]: paymentAt(bank) } });

const bankOf = async (client: Harness["person"]) => {
  const read = (await client.call("settings.values.get", { keys: [SETTING] })) as Result<{
    values: { [SETTING]: { bank: string } };
  }>;
  return read.ok ? read.value.values[SETTING].bank : read.error.code;
};

describe("which writes wait (spec 004, D7)", () => {
  itHoldsAsThePolicySays([
    ["destructive_and_sensitive", "settings.values.update", "mcp", true],
    ["destructive_and_sensitive", "settings.values.update", "ui", false],
    ["destructive_and_sensitive", "settings.values.update", "system", false],
    ["destructive_and_sensitive", "settings.values.get", "mcp", false],
    ["all", "settings.values.update", "mcp", true],
    ["all", "settings.values.update", "ui", false],
    ["all", "settings.values.get", "mcp", false],
    ["none", "settings.values.update", "mcp", false],
  ]);
});

describe("the approvals kernel (AC5)", () => {
  it("holds an assistant's change, and a person's approval makes it as the requester", async () => {
    const { assistant, person } = setup();
    const before = await bankOf(person);
    // The held change writes "Bank A"; a preset already on it would make "untouched" prove nothing.
    expect(before).not.toBe("Bank A");

    const held = await change(assistant);
    const waiting = await assistant.call("approvals.get", { approvalId: idOf(held) });
    const untouched = await bankOf(person);
    const approved = await person.call("approvals.approve", { approvalId: idOf(held) });
    const after = await assistant.call("approvals.get", { approvalId: idOf(held) });

    expect([held, waiting, untouched, approved, await bankOf(person)]).toMatchObject([
      { status: "awaiting_approval", approvalId: expect.any(String) },
      { ok: true, value: { status: "pending", capabilityId: "settings.values.update", requestedByYou: true } },
      before,
      { ok: true, value: { status: "approved", result: { values: { [SETTING]: { bank: "Bank A" } } } } },
      "Bank A",
    ]);
    expect(after).toMatchObject({
      ok: true,
      value: {
        status: "approved",
        result: { values: { [SETTING]: { bank: "Bank A" } } },
        decidedAt: expect.any(String),
      },
    });
  });

  it("never returns the held input from approvals.get", async () => {
    const { assistant } = setup();
    const held = await change(assistant, "a private bank");
    expect(JSON.stringify(await assistant.call("approvals.get", { approvalId: idOf(held) }))).not.toContain("private");
  });

  it("answers the same approvalId to a retried hold, and queues one approval", async () => {
    const { assistant, person } = setup();
    const first = await change(assistant);
    const retry = await change(assistant);
    const listed = await person.call("approvals.list", {});
    expect([idOf(retry), listed]).toMatchObject([idOf(first), { ok: true, value: { items: [{}] } }]);
  });

  it("queues a second approval for a different input", async () => {
    const { assistant, person } = setup();
    await change(assistant, "one bank");
    await change(assistant, "another bank");
    expect(await person.call("approvals.list", {})).toMatchObject({ ok: true, value: { items: [{}, {}] } });
  });

  it("lists pending first with the input and who asked, and hides what the decider needs not see", async () => {
    const { assistant, person } = setup();
    const rejected = await change(assistant, "first");
    await person.call("approvals.reject", { approvalId: idOf(rejected) });
    await change(assistant, "second");
    const listed = await person.call("approvals.list", {});
    expect(listed).toMatchObject({
      ok: true,
      value: {
        items: [
          {
            status: "pending",
            capabilityId: "settings.values.update",
            input: { values: { [SETTING]: { bank: "second" } } },
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
    const before = await bankOf(person);
    const held = await change(assistant);

    time.ms = START + APPROVAL_TTL_MS;
    const read = await assistant.call("approvals.get", { approvalId: idOf(held) });
    const approved = await person.call("approvals.approve", { approvalId: idOf(held) });

    expect([read, approved, await bankOf(person)]).toMatchObject([
      { ok: true, value: { status: "expired", decidedAt: new Date(START + APPROVAL_TTL_MS).toISOString() } },
      { ok: false, error: { code: "approvals.expired" } },
      before,
    ]);
  });

  it("is still pending a moment before the deadline", async () => {
    const { assistant, time } = setup();
    const held = await change(assistant);
    time.ms = START + APPROVAL_TTL_MS - 1;
    expect(await assistant.call("approvals.get", { approvalId: idOf(held) })).toMatchObject({
      ok: true,
      value: { status: "pending" },
    });
  });

  it("answers conflict, and records it, when a person changed the same setting meanwhile", async () => {
    const { assistant, person } = setup();
    const held = await change(assistant, "assistant bank");
    await change(person, "person bank");

    const approved = await person.call("approvals.approve", { approvalId: idOf(held) });
    const read = await assistant.call("approvals.get", { approvalId: idOf(held) });

    expect([approved, read, await bankOf(person)]).toMatchObject([
      { ok: false, error: { code: "approvals.conflict" } },
      { ok: true, value: { status: "conflict", error: { code: "approvals.conflict" } } },
      "person bank",
    ]);
  });

  it("approves a change although a person changed another setting meanwhile", async () => {
    const { assistant, person } = setup();
    const held = await change(assistant);
    await person.call("settings.values.update", {
      values: {
        "business.invoicing": {
          defaultTax: "gst",
          taxRates: { gst: 1, vat: 2, "service-tax": 3 },
          paymentTermsDays: 7,
        },
      },
    });

    expect(await person.call("approvals.approve", { approvalId: idOf(held) })).toMatchObject({
      ok: true,
      value: { status: "approved" },
    });
  });

  it("refuses a write whose requester no longer holds the permission, and records it", async () => {
    const { assistant, person } = setup({ revokedRole: "owner" });
    const before = await bankOf(person);
    const held = await change(assistant);

    const approved = await person.call("approvals.approve", { approvalId: idOf(held) });

    expect([approved, await bankOf(person)]).toMatchObject([
      { ok: false, error: { code: "approvals.requester_forbidden" } },
      before,
    ]);
    expect(await assistant.call("approvals.get", { approvalId: idOf(held) })).toMatchObject({
      ok: true,
      value: { status: "conflict", error: { code: "approvals.requester_forbidden" } },
    });
  });

  it("rejects with a reason the requester sees, and never runs the write", async () => {
    const { assistant, person } = setup();
    const before = await bankOf(person);
    const held = await change(assistant);

    const rejected = await person.call("approvals.reject", { approvalId: idOf(held), reason: "Wrong bank" });
    const read = await assistant.call("approvals.get", { approvalId: idOf(held) });
    const again = await person.call("approvals.approve", { approvalId: idOf(held) });

    expect([rejected, read, again, await bankOf(person)]).toMatchObject([
      { ok: true, value: { status: "rejected" } },
      { ok: true, value: { status: "rejected", reason: "Wrong bank", decidedAt: expect.any(String) } },
      { ok: false, error: { code: "approvals.not_pending" } },
      before,
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

  it("lets the owner approve a held write", async () => {
    const { assistant, as } = setup();
    const held = await change(assistant);
    expect(await as("owner", "ui").call("approvals.approve", { approvalId: idOf(held) })).toMatchObject({ ok: true });
  });

  it.each(["approvals.approve", "approvals.reject"] as const)("refuses staff on %s", async (id) => {
    const { assistant, as } = setup();
    const held = await change(assistant);
    expect(await as("staff", "ui").call(id, { approvalId: idOf(held) })).toMatchObject({
      ok: false,
      error: { code: "access.forbidden" },
    });
  });

  const clerk: Actor = { actorId: "demo-clerk", roleId: "manager", permissions: ["decide:approvals"] };

  it.each([
    ["a manager, who lacks manage:settings", actorOf("manager")],
    ["a clerk who holds only decide:approvals", clerk],
  ] as const)(
    "refuses %s: may decide but may not do the write, and leaves the request pending",
    async (_label, decider) => {
      const { assistant, as, person } = setup();
      const before = await bankOf(person);
      const held = await change(assistant);

      const approved = await as("manager", "ui", decider).call("approvals.approve", { approvalId: idOf(held) });

      expect([
        approved,
        await assistant.call("approvals.get", { approvalId: idOf(held) }),
        await bankOf(person),
      ]).toMatchObject([
        { ok: false, error: { code: "access.forbidden" } },
        { ok: true, value: { status: "pending" } },
        before,
      ]);
    },
  );

  it("lets one actor see that a write is not another's", async () => {
    const { assistant, as } = setup();
    const held = await change(assistant);
    expect(await as("manager", "ui").call("approvals.get", { approvalId: idOf(held) })).toMatchObject({
      ok: true,
      value: { requestedByYou: false },
    });
  });

  it("keeps two actors' identical requests apart, and the second is a conflict once the first applies", async () => {
    const { assistant, as, person } = setup();
    const first = await change(assistant);
    const second = await change(as("owner", "mcp", { ...actorOf("owner"), actorId: "demo-owner-two" }));

    const approvedFirst = await person.call("approvals.approve", { approvalId: idOf(first) });
    const approvedSecond = await person.call("approvals.approve", { approvalId: idOf(second) });

    expect([idOf(second) === idOf(first), approvedFirst, approvedSecond]).toMatchObject([
      false,
      { ok: true },
      { ok: false, error: { code: "approvals.conflict" } },
    ]);
  });
});

describe("deciding at the same moment", () => {
  itAppliesOnceWhenApprovedTwiceInOneTick([
    {
      label: "settings.values.update",
      policy: "destructive_and_sensitive",
      hold: (assistant) => change(assistant),
      applied: async (person) => ({ bank: await bankOf(person) }),
      expected: { bank: "Bank A" },
    },
  ]);

  it("refuses a rejection that arrives while the approval runs, so the audit stays whole", async () => {
    const { assistant, person } = setup();
    const held = await change(assistant);

    const [approved, rejected] = await Promise.all([
      person.call("approvals.approve", { approvalId: idOf(held) }),
      person.call("approvals.reject", { approvalId: idOf(held) }),
    ]);

    expect([approved, rejected]).toMatchObject([{ ok: true }, { ok: false, error: { code: "approvals.not_pending" } }]);
  });
});

describe("failing closed", () => {
  it("holds destructive writes when the registry has no approval setting", () => {
    expect(policyOf(createSettingsReader({}))).toBe("destructive_and_sensitive");
  });
});

describe("what the default policy holds through MCP (AC5, pinned)", () => {
  it("holds exactly these kernel writes; a change to the list is a decision, not an accident", () => {
    expect(heldThroughMcp()).toEqual(["settings.values.update"]);
  });

  const holders = MODULES.filter(({ id }) => heldThroughMcp(id).length > 0);

  // This checks that each module owns a file for its held writes; that file pins them with `heldThroughMcp`.
  it.each(holders.map(({ id, owns }) => ({ id, owns })))(
    "$id holds writes, so it owns its approvals.<module>.test.ts, where they are pinned",
    ({ id, owns }) => {
      expect(owns).toContain(`src/config/approvals.${id}.test.ts`);
    },
  );
});

describe("who reads the queue", () => {
  it.each(["owner", "manager"] as const)("lets the %s list the held writes", async (roleId) => {
    const { assistant, as } = setup();
    await change(assistant);
    expect(await as(roleId, "ui").call("approvals.list", {})).toMatchObject({
      ok: true,
      value: { items: [{ input: { values: { [SETTING]: { bank: "Bank A" } } } }] },
    });
  });

  it("keeps the held inputs from staff", async () => {
    const { as } = setup();
    expect(await as("staff", "ui").call("approvals.list", {})).toMatchObject({
      ok: false,
      error: { code: "access.forbidden" },
    });
  });
});

describe("the policy", () => {
  it("lets a change run when no write waits", async () => {
    const { assistant, person } = setup({ policy: "none" });
    expect([await change(assistant), await bankOf(person)]).toMatchObject([{ ok: true }, "Bank A"]);
  });

  it("never holds a person's own write", async () => {
    const { person } = setup();
    expect([await change(person), await bankOf(person)]).toMatchObject([{ ok: true }, "Bank A"]);
  });

  it("changes in the session when the owner sets it, and settings.values.get shows the choice", async () => {
    const { assistant, person } = setup();
    const set = await person.call("approvals.policy.set", { policy: "none" });
    const shown = await person.call("settings.values.get", { keys: ["approvals.policy"] });
    expect([set, shown, await change(assistant)]).toMatchObject([
      { ok: true, value: { policy: "none" } },
      { ok: true, value: { values: { "approvals.policy": "none" } } },
      { ok: true, value: { values: { [SETTING]: { bank: "Bank A" } } } },
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
    Promise.all(Array.from({ length: count }, (_unused, n) => change(client, `bank ${n}`)));

  it("refuses a new hold with approvals.queue_full when every record is pending", async () => {
    const { assistant } = setup();
    await holdMany(assistant, MAX_APPROVALS);

    expect(await change(assistant, "one too many")).toMatchObject({
      ok: false,
      error: { code: "approvals.queue_full" },
    });
  });

  it("makes room by dropping a decided record, never a pending one", async () => {
    const { assistant, person } = setup();
    const held = await holdMany(assistant, MAX_APPROVALS);
    await person.call("approvals.reject", { approvalId: idOf(held[0]) });

    const next = await change(assistant, "fits now");
    const dropped = await assistant.call("approvals.get", { approvalId: idOf(held[0]) });
    const kept = await assistant.call("approvals.get", { approvalId: idOf(held[1]) });

    expect([next, dropped, kept]).toMatchObject([
      { status: "awaiting_approval" },
      { ok: false, error: { code: "approvals.not_found" } },
      { ok: true, value: { status: "pending" } },
    ]);
  });
});
