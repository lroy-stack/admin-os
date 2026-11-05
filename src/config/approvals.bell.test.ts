import { describe, expect, it } from "vitest";

import { actorOf, type Harness, idOf, setup } from "./approvals.testkit";
import { type BellRuntime, bellUnread, loadBell } from "./bell.server";

/** The bell's lines about a waiting write (ADR 0017 "The bell"; the mechanism is in approvals.test.ts). */
const BOOKING = "R-1046";

const cancel = (client: Harness["assistant"]) =>
  client.call("bookings.cancel", { id: BOOKING, reason: "Guest called" });

const runtimeOf = (client: Harness["person"], role: "owner" | "staff"): BellRuntime => ({
  call: (id, input) => client.call(id as never, input as never),
  permissions: actorOf(role).permissions,
  locale: "en",
});

const approvalRowsOf = async (runtime: BellRuntime) => {
  const answer = await loadBell(runtime);
  expect(answer).toMatchObject({ ok: true });
  return answer.ok ? answer.value.items.filter(({ feed }) => feed === "approvals") : [];
};

describe("the bell", () => {
  it("tells the people who decide that a write waits, until it is decided", async () => {
    const { assistant, person } = setup();
    const held = await cancel(assistant);

    const waiting = await approvalRowsOf(runtimeOf(person, "owner"));
    await person.call("approvals.reject", { approvalId: idOf(held) });
    const decided = await approvalRowsOf(runtimeOf(person, "owner"));

    expect([waiting, decided]).toMatchObject([
      [
        {
          id: `approval.requested:${idOf(held)}`,
          kind: "approval.requested",
          title: "An assistant is waiting for your approval",
          body: `An assistant asks to cancel booking ${BOOKING}.`,
          unread: true,
          approvalId: idOf(held),
        },
      ],
      [],
    ]);
  });

  it("counts the waiting write with the unread notifications, and drops it once decided", async () => {
    const { assistant, person } = setup();
    const runtime = runtimeOf(person, "owner");
    const before = await bellUnread(runtime);
    const held = await cancel(assistant);
    const waiting = await bellUnread(runtime);
    await person.call("approvals.reject", { approvalId: idOf(held) });

    expect([waiting, await bellUnread(runtime)]).toEqual([(before ?? 0) + 1, before]);
  });

  it("does not tell staff, who cannot decide", async () => {
    const { assistant, as } = setup();
    await cancel(assistant);
    expect(await approvalRowsOf(runtimeOf(as("staff", "ui"), "staff"))).toEqual([]);
  });
});
