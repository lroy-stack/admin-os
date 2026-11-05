import { describe, expect, it } from "vitest";

import type { Actor } from "@/core/client";
import type { CallResult, Result } from "@/core/result";

import {
  actorOf,
  type Harness,
  heldThroughMcp,
  idOf,
  itAppliesOnceWhenApprovedTwiceInOneTick,
  itHoldsAsThePolicySays,
  okValueOf,
  setup,
} from "./approvals.testkit";

/** What the approval mechanism does with the `customers` module's writes (ADR 0017 §7; the mechanism is in approvals.test.ts). */
describe("which customers writes wait (spec 004, D7)", () => {
  itHoldsAsThePolicySays([["destructive_and_sensitive", "customers.block", "mcp", true]]);
});

describe("what the default policy holds of customers through MCP (AC5, pinned)", () => {
  it("is exactly these three writes; a change to the list is a decision, not an accident", () => {
    expect(heldThroughMcp("customers")).toEqual(["customers.block", "customers.contact.update", "customers.unblock"]);
  });
});

// The kernel has no write idempotent by key, so the keyed cases stay on `customers.create` until a customers walk
// after M9 (plan 006, M4d).
describe("a held customers write retried with its key", () => {
  it("replays a held keyed write retried with the same key, as one approval", async () => {
    const { assistant, person } = setup({ policy: "all" });
    const create = () =>
      assistant.call("customers.create", { name: "Keyed Guest", phone: "+34611222333" }, { idempotencyKey: "k-held" });

    const first = await create();
    const retry = await create();

    expect([idOf(retry), await person.call("approvals.list", {})]).toMatchObject([
      idOf(first),
      { ok: true, value: { items: [{}] } },
    ]);
  });
});

describe("deciding a customers write at the same moment", () => {
  const customerNamed = async (person: Harness["person"], name: string) =>
    okValueOf(
      (await person.call("customers.list", { limit: 200 })) as CallResult<{ items: { name: string }[] }>,
    ).items.filter((customer) => customer.name === name).length;

  itAppliesOnceWhenApprovedTwiceInOneTick([
    {
      label: "customers.create",
      policy: "all",
      hold: (assistant) =>
        assistant.call(
          "customers.create",
          { name: "Parallel Guest", phone: "+34611999888" },
          { idempotencyKey: crypto.randomUUID() },
        ),
      applied: async (person) => ({ created: await customerNamed(person, "Parallel Guest") }),
      expected: { created: 1 },
    },
  ]);
});

describe("who is named on an approved customers write", () => {
  it("signs a customer note with the name the requester was shown", async () => {
    const { as, person } = setup({ policy: "all" });
    const requester: Actor = { ...actorOf("owner"), displayName: "Alex Morgan" };
    const held = await as("owner", "mcp", requester).call(
      "customers.notes.add",
      { id: "C-iglesias", text: "Prefers the terrace" },
      { idempotencyKey: crypto.randomUUID() },
    );

    await person.call("approvals.approve", { approvalId: idOf(held) });

    const customer = (await person.call("customers.get", { id: "C-iglesias" })) as Result<{
      notes: { authorName: string; authorId: string }[];
    }>;
    expect(customer).toMatchObject({
      ok: true,
      value: { notes: expect.arrayContaining([expect.objectContaining({ authorName: "Alex Morgan" })]) },
    });
  });
});
