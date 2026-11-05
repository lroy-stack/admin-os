import { describe, expect, it } from "vitest";

import type { Result } from "@/core/result";

import { type Harness, idOf, setup } from "./approvals.testkit";

/** The notifications module's lines about a waiting write (ADR 0017 §7; the mechanism is in approvals.test.ts). */
const BOOKING = "R-1046";

const cancel = (client: Harness["assistant"]) =>
  client.call("bookings.cancel", { id: BOOKING, reason: "Guest called" });

describe("the notification", () => {
  const approvalItems = async (client: Harness["person"]) => {
    const listed = await client.call("notifications.list", { limit: 100 });
    expect(listed).toMatchObject({ ok: true });
    const { items } = (
      listed as Result<{ items: { kind: string; id: string }[] }> & { value: { items: { kind: string; id: string }[] } }
    ).value;
    return items.filter((item) => item.kind === "approval.requested");
  };

  it("tells the people who decide that a write waits, until it is decided", async () => {
    const { assistant, person } = setup();
    const held = await cancel(assistant);

    const waiting = await approvalItems(person);
    await person.call("approvals.reject", { approvalId: idOf(held) });
    const decided = await approvalItems(person);

    expect([waiting, decided]).toMatchObject([
      [
        {
          bodyKey: "notifications.kinds.approvalRequested.body.bookingsCancel",
          params: { target: BOOKING },
          createdAt: { day: "2026-10-31", minute: 13 * 60 },
          link: { entity: "approval" },
        },
      ],
      [],
    ]);
  });

  it("does not tell staff, who cannot decide", async () => {
    const { assistant, as } = setup();
    await cancel(assistant);
    expect(await approvalItems(as("staff", "ui"))).toEqual([]);
  });

  it.each([
    ["notifications.read_all", () => ({})],
    ["notifications.read", (ids: string[]) => ({ ids })],
  ] as const)("stays unread after an agent calls %s", async (id, inputFor) => {
    const { assistant, person } = setup();
    const held = await cancel(assistant);
    const ids = (await approvalItems(person)).map((item) => item.id);

    await assistant.call(id, inputFor(ids));

    expect([idOf(held), await approvalItems(person)]).toMatchObject([
      idOf(held),
      [{ id: `approval.requested:${idOf(held)}` }],
    ]);
  });
});
