import { describe, expect, it } from "vitest";
import { z } from "zod";

import { DEFAULT_ROLES, permissionsOf } from "@/core/access";
import { type Actor, createClient } from "@/core/client";
import type { CallResult } from "@/core/result";
import { notificationsList, notificationsRead, notificationsReadAll, unreadCountOutput } from "@/modules/notifications";

import { CATALOG } from "./catalog";
import { getAdapter } from "./data.server";
import { VERTICALS, type VerticalId } from "./vertical";

const quiet = { retryDelayMs: 0, logger: () => undefined, mode: "production" } as const;

const presets = ["hospitality", "salon", "workshop"] as const satisfies readonly VerticalId[];

const actorOf = (vertical: VerticalId, role: 0 | 1 | 2): Actor => ({
  actorId: `demo-${DEFAULT_ROLES[role].id}`,
  roleId: DEFAULT_ROLES[role].id,
  permissions: permissionsOf(DEFAULT_ROLES[role], CATALOG, VERTICALS[vertical].modules),
});

const session = (vertical: VerticalId, role: 0 | 1 | 2 = 0, sessionId = crypto.randomUUID()) =>
  createClient(CATALOG, getAdapter({ vertical, sessionId }), { ...quiet, actor: actorOf(vertical, role) });

type Client = ReturnType<typeof session>;

const key = () => ({ idempotencyKey: crypto.randomUUID() });

const successOf = (result: CallResult<unknown>): unknown => {
  if (!("ok" in result) || !result.ok) throw new Error(`Expected a success, got ${JSON.stringify(result)}`);
  return result.value;
};

const feed = async (client: Client, input: { cursor?: string; limit?: number } = {}) =>
  notificationsList.output.parse(successOf(await client.call("notifications.list", { limit: 100, ...input })));

/** A phone booking in the evening service window of each preset, far enough from the clock to be neither soon nor late. */
const newBooking = (vertical: VerticalId) => ({
  businessDay: "2026-10-31",
  startMin: vertical === "hospitality" ? 22 * 60 : 15 * 60,
  partySize: 1,
  contactName: "Notify Me",
  channel: "phone",
});

const readOutcome = (result: CallResult<unknown>) => notificationsRead.output.parse(successOf(result));

describe.each(presets)("notifications in the %s preset", (vertical) => {
  it("lists the seeded day's notifications newest first", async () => {
    const { items } = await feed(session(vertical));
    const moments = items.map((item) => item.createdAt.minute);
    expect([items.length > 0, moments]).toEqual([true, [...moments].sort((a, b) => b - a)]);
  });

  it("counts every seeded notification as unread", async () => {
    const { items, unreadCount } = await feed(session(vertical));
    expect(unreadCount).toBe(items.length);
  });

  it("answers the same unread count from notifications.unread.count", async () => {
    const client = session(vertical);
    const [{ unreadCount }, counted] = await Promise.all([feed(client), client.call("notifications.unread.count", {})]);
    expect(unreadCountOutput.parse(successOf(counted))).toEqual({ unreadCount });
  });

  it("points every item at message keys and a booking link, not at rendered text", async () => {
    const { items } = await feed(session(vertical));
    expect(items.map((item) => [item.titleKey.startsWith("notifications."), item.link?.entity])).toEqual(
      items.map(() => [true, "booking"]),
    );
  });

  it("pages the feed without repeating or losing an item", async () => {
    const client = session(vertical);
    await client.call("bookings.create", { ...newBooking(vertical), contactName: "Second Item" }, key());
    const all = (await feed(client)).items.map((item) => item.id);
    const first = await feed(client, { limit: 1 });
    const second = await feed(client, { limit: 1, ...(first.nextCursor ? { cursor: first.nextCursor } : {}) });
    expect([...first.items, ...second.items].map((item) => item.id)).toEqual(all.slice(0, 2));
  });

  it("keeps the unread count of the whole feed on a short page", async () => {
    const client = session(vertical);
    const [all, short] = await Promise.all([feed(client), feed(client, { limit: 1 })]);
    expect(short.unreadCount).toBe(all.unreadCount);
  });

  it("marks a notification read and then lists it with readAt and a lower unread count", async () => {
    const client = session(vertical);
    const before = await feed(client);
    const target = before.items[0];
    const outcome = readOutcome(await client.call("notifications.read", { ids: [target?.id ?? ""] }, key()));
    const after = await feed(client);
    expect([outcome, after.unreadCount, after.items[0]?.readAt !== undefined]).toEqual([
      { marked: 1, unreadCount: before.unreadCount - 1 },
      before.unreadCount - 1,
      true,
    ]);
  });

  it("ignores unknown ids and ids already read", async () => {
    const client = session(vertical);
    const [target] = (await feed(client)).items;
    await client.call("notifications.read", { ids: [target?.id ?? ""] }, key());
    const again = readOutcome(await client.call("notifications.read", { ids: [target?.id ?? "", "nope:1"] }, key()));
    expect(again.marked).toBe(0);
  });

  it("marks everything read with notifications.read_all", async () => {
    const client = session(vertical);
    const before = await feed(client);
    const outcome = notificationsReadAll.output.parse(
      successOf(await client.call("notifications.read_all", {}, key())),
    );
    expect([outcome, (await feed(client)).unreadCount]).toEqual([{ marked: before.unreadCount, unreadCount: 0 }, 0]);
  });

  it("returns the first result when the same idempotency key is replayed", async () => {
    const client = session(vertical);
    const [target] = (await feed(client)).items;
    const options = key();
    const input = { ids: [target?.id ?? ""] };
    const first = await client.call("notifications.read", input, options);
    const second = await client.call("notifications.read", input, options);
    expect(second).toEqual(first);
  });

  it("refuses the same idempotency key with a different input", async () => {
    const client = session(vertical);
    const options = key();
    await client.call("notifications.read", { ids: ["a:1"] }, options);
    expect(await client.call("notifications.read", { ids: ["b:1"] }, options)).toMatchObject({
      ok: false,
      error: { code: "client.idempotency_conflict" },
    });
  });

  it("marks notifications read without an idempotency key, since marking read is idempotent (spec 004 D6)", async () => {
    const client = session(vertical);
    const [target] = (await feed(client)).items;
    const input = { ids: [target?.id ?? ""] };
    const first = readOutcome(await client.call("notifications.read", input));
    const again = readOutcome(await client.call("notifications.read", input));
    expect([first.marked, again.marked]).toEqual([1, 0]);
  });

  it("does not show one session's read marks to another", async () => {
    const mine = session(vertical);
    await mine.call("notifications.read_all", {}, key());
    const other = await feed(session(vertical));
    expect(other.unreadCount).toBe(other.items.length);
  });

  it("derives a notification from a booking created in the session", async () => {
    const client = session(vertical);
    const before = await feed(client);
    const created = await client.call("bookings.create", newBooking(vertical), key());
    const { id } = z.object({ id: z.string() }).parse(successOf(created));
    const after = await feed(client);
    expect([after.items.map((item) => item.id).includes(`booking.new:${id}`), after.unreadCount]).toEqual([
      true,
      before.unreadCount + 1,
    ]);
  });
});

describe("notifications permissions by role", () => {
  it.each([0, 1, 2] as const)("lets role %s read and mark its own notifications", (role) => {
    expect(actorOf("hospitality", role).permissions).toEqual(
      expect.arrayContaining(["read:notifications", "update:notifications"]),
    );
  });

  it("answers access.forbidden to an actor without read:notifications", async () => {
    const client = createClient(CATALOG, getAdapter({ vertical: "hospitality" }), {
      ...quiet,
      actor: { actorId: "x", roleId: "anonymous", permissions: ["read:bookings"] },
    });
    expect(await client.call("notifications.list", { limit: 5 })).toMatchObject({
      ok: false,
      error: { code: "access.forbidden" },
    });
  });

  it("answers access.forbidden to marking read without update:notifications", async () => {
    const client = createClient(CATALOG, getAdapter({ vertical: "hospitality", sessionId: crypto.randomUUID() }), {
      ...quiet,
      actor: { actorId: "x", roleId: "anonymous", permissions: ["read:notifications"] },
    });
    expect(await client.call("notifications.read", { ids: ["a:1"] }, key())).toMatchObject({
      ok: false,
      error: { code: "access.forbidden" },
    });
  });
});
