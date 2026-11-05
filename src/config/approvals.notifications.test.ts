import { describe, expect, it } from "vitest";

import type { CallResult } from "@/core/result";

import { actorOf, idOf, okValueOf, setup } from "./approvals.testkit";
import { type BellRuntime, bellUnread, bellWriteOf, loadBell } from "./bell.server";
import { MODULES } from "./modules.generated";
import { MODULE_SERVERS } from "./modules.server.generated";

/**
 * The notifications module's lines about the bell (ADR 0017 "The bell"): its feed is the module's, and the bell keeps
 * its approvals without it. The bell's own cases are in approvals.bell.test.ts.
 */
const BOOKING = "R-1046";

const cancel = (client: ReturnType<typeof setup>["assistant"]) =>
  client.call("bookings.cancel", { id: BOOKING, reason: "Guest called" });

const runtimeOf = (client: ReturnType<typeof setup>["person"]): BellRuntime => ({
  call: (id, input) => client.call(id as never, input as never),
  permissions: actorOf("owner").permissions,
  locale: "en",
});

const approvalIds = async (runtime: BellRuntime) =>
  okValueOf(await loadBell(runtime))
    .items.filter(({ feed }) => feed === "approvals")
    .map(({ id }) => id);

describe("the notifications feed in the bell", () => {
  it("is run by the capabilities its descriptor names", () => {
    expect([
      bellWriteOf({ op: "read", feed: "notifications", input: {} }),
      bellWriteOf({ op: "readAll", feed: "notifications", input: {} }),
    ]).toEqual(["notifications.read", "notifications.read_all"]);
  });

  it("lists the day's bookings after the approvals, each row stamped with its feed", async () => {
    const { assistant, person } = setup();
    const held = await cancel(assistant);
    const { items } = okValueOf(await loadBell(runtimeOf(person)));
    expect(items.map(({ feed }) => feed)).toEqual(["approvals", ...items.slice(1).map(() => "notifications")]);
    expect(items[0]?.id).toBe(`approval.requested:${idOf(held)}`);
    expect(items.length).toBeGreaterThan(1);
  });

  it.each([
    ["notifications.read_all", () => ({})],
    ["notifications.read", (ids: string[]) => ({ ids })],
  ] as const)("cannot silence a waiting write: %s from an agent leaves it in the bell", async (id, inputFor) => {
    const { assistant, person } = setup();
    const held = await cancel(assistant);
    const ids = await approvalIds(runtimeOf(person));

    await assistant.call(id, inputFor(ids));

    expect(await approvalIds(runtimeOf(person))).toEqual([`approval.requested:${idOf(held)}`]);
  });

  it("holds no waiting write in its own list, which is what the day's bookings give rise to", async () => {
    const { assistant, person } = setup();
    await cancel(assistant);
    const { items } = okValueOf(
      (await person.call("notifications.list", { limit: 100 })) as CallResult<{ items: { kind: string }[] }>,
    );
    expect(items.length).toBeGreaterThan(0);
    expect(items.map(({ kind }) => kind)).not.toContain("approval.requested");
  });

  it("leaves the bell with its approvals when the module is not installed", async () => {
    const { assistant, person } = setup();
    const held = await cancel(assistant);
    const without = {
      manifests: MODULES.filter(({ id }) => id !== "notifications"),
      servers: MODULE_SERVERS.filter(({ id }) => id !== "notifications"),
    };
    const runtime = runtimeOf(person);

    const answer = okValueOf(await loadBell(runtime, without));

    expect([
      answer.items.map(({ id, feed }) => [feed, id]),
      await bellUnread(runtime, without),
      bellWriteOf({ op: "read", feed: "notifications", input: {} }, without.manifests),
    ]).toEqual([[["approvals", `approval.requested:${idOf(held)}`]], 1, undefined]);
  });
});
