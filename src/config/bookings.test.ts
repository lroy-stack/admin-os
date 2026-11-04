import { describe, expect, it } from "vitest";

import { DEFAULT_ROLES, permissionsOf } from "@/core/access";
import { type Actor, createClient } from "@/core/client";
import { fixedClock } from "@/core/clock";
import { createMockAdapter, createSessionStore } from "@/core/mock";
import type { CallResult } from "@/core/result";
import { type BookingInput, type BookingStatus, bookingSchema, bookingStatuses } from "@/modules/bookings";
import { hospitalityClock, hospitalitySeed } from "@/verticals/hospitality/server";
import { salonClock, salonSeed } from "@/verticals/salon/server";
import { workshopClock, workshopSeed } from "@/verticals/workshop/server";

import { CATALOG } from "./catalog";
import { MOCK_HANDLERS, settingsFor } from "./data.server";
import { VERTICALS, type VerticalId } from "./vertical";

const quiet = { retryDelayMs: 0, logger: () => undefined, mode: "production" } as const;
const DAY = "2026-10-31";

const SEEDS = { hospitality: hospitalitySeed, salon: salonSeed, workshop: workshopSeed } as const;
const CLOCKS = { hospitality: hospitalityClock, salon: salonClock, workshop: workshopClock } as const;

/** What each preset's seeded day offers, so one set of tests runs on all three. */
const presets = [
  {
    vertical: "hospitality",
    stay: 90,
    free: "S8",
    freeAt: 22 * 60,
    tooSmall: { resourceId: "S2", partySize: 3 },
    busy: { resourceId: "S2", at: 19 * 60 + 30 },
    offGrid: 19 * 60 + 10,
    outside: 18 * 60,
    customerId: "C-iglesias",
    lateConfirmed: "R-1046",
    slotCount: 20,
  },
  {
    vertical: "salon",
    stay: 45,
    free: "chair-3",
    freeAt: 15 * 60,
    tooSmall: { resourceId: "chair-3", partySize: 2 },
    busy: { resourceId: "chair-1", at: 10 * 60 + 30 },
    offGrid: 15 * 60 + 5,
    outside: 8 * 60,
    customerId: "client-nora",
    lateConfirmed: "A-201",
    slotCount: 36,
  },
  {
    vertical: "workshop",
    stay: 90,
    free: "bay-1",
    freeAt: 15 * 60,
    tooSmall: { resourceId: "bay-1", partySize: 2 },
    busy: { resourceId: "bay-1", at: 8 * 60 + 30 },
    offGrid: 15 * 60 + 15,
    outside: 7 * 60,
    customerId: "cust-carmen",
    lateConfirmed: "W-301",
    slotCount: 20,
  },
].map((preset) => [preset.vertical as VerticalId, preset] as const);

const ownerPermissions = (vertical: VerticalId) =>
  permissionsOf(DEFAULT_ROLES[0], CATALOG, VERTICALS[vertical].modules);

const actorWith = (permissions: readonly string[]): Actor => ({
  actorId: "demo-owner",
  displayName: "Alex Morgan",
  roleId: "owner",
  permissions,
});

type Seed = (typeof SEEDS)[VerticalId];

/**
 * One demo session on one preset, with the business clock under the test's control: `at(minute)` is a client whose
 * clock reads that minute, over the same session data. No real time is involved.
 */
function world(vertical: VerticalId, seed: Seed = SEEDS[vertical]) {
  const store = createSessionStore<Seed>(seed);
  const sessionId = crypto.randomUUID();
  const clientAt = (nowMin: number, permissions: readonly string[] = ownerPermissions(vertical)) =>
    createClient(
      CATALOG,
      createMockAdapter({
        handlers: MOCK_HANDLERS,
        store,
        sessionId,
        clock: fixedClock({ ...CLOCKS[vertical], nowMin }),
        settings: settingsFor(vertical),
      }),
      { ...quiet, actor: actorWith(permissions) },
    );
  return { client: clientAt(CLOCKS[vertical].nowMin), clientAt };
}

type Client = ReturnType<typeof world>["client"];

const key = () => ({ idempotencyKey: crypto.randomUUID() });

const successValue = (result: CallResult<unknown>): unknown => {
  if (!("ok" in result) || !result.ok) throw new Error(`Expected a success, got ${JSON.stringify(result)}`);
  return result.value;
};
const bookingOf = (result: CallResult<unknown>) => bookingSchema.parse(successValue(result));

const listIds = async (client: Client, businessDay = DAY) =>
  (
    successValue(await client.call("bookings.list", { businessDay, limit: 200 })) as { items: { id: string }[] }
  ).items.map((item) => item.id);

const slotsOf = async (client: Client, partySize: number, businessDay = DAY) =>
  (
    successValue(await client.call("bookings.availability.get", { businessDay, partySize })) as {
      slots: { startMin: number; endMin: number; resourceIds: string[] }[];
    }
  ).slots;

const booking = (status: BookingStatus, id = `b-${status}`): BookingInput => ({
  id,
  status,
  businessDay: DAY,
  startMin: 20 * 60,
  endMin: 21 * 60,
  resourceIds: [],
  staffIds: [],
  contactName: "Rey",
  partySize: 2,
  lines: [],
  origin: "staff",
  tags: [],
});

const hospitalityWith = (bookings: BookingInput[], resources = hospitalitySeed.resources) =>
  ({ ...hospitalitySeed, bookings, resources }) as Seed;

describe.each(presets)("bookings writes in the %s preset", (vertical, p) => {
  const createInput = (extra: Record<string, unknown> = {}) => ({
    businessDay: DAY,
    startMin: p.freeAt,
    partySize: 1,
    resourceIds: [p.free],
    contactName: "Walk Up",
    channel: "phone",
    ...extra,
  });

  describe("create", () => {
    it("creates a confirmed staff booking that bookings.list then returns in the same session", async () => {
      const { client } = world(vertical);
      const created = bookingOf(await client.call("bookings.create", createInput(), key()));
      expect([created.status, created.origin, created.endMin, await listIds(client)]).toEqual([
        "confirmed",
        "staff",
        p.freeAt + p.stay,
        expect.arrayContaining([created.id]),
      ]);
    });

    it("books a guest on record by customer id", async () => {
      const { client } = world(vertical);
      const input = createInput({ contactName: undefined, customerId: p.customerId });
      expect(bookingOf(await client.call("bookings.create", input, key()))).toMatchObject({
        customerId: p.customerId,
      });
    });

    it("does not show a booking created in one session to another", async () => {
      const created = bookingOf(await world(vertical).client.call("bookings.create", createInput(), key()));
      expect(await listIds(world(vertical).client)).not.toContain(created.id);
    });

    it("answers bookings.not_found for a customer that does not exist", async () => {
      const input = createInput({ contactName: undefined, customerId: "ghost" });
      expect(await world(vertical).client.call("bookings.create", input, key())).toMatchObject({
        ok: false,
        error: { code: "bookings.not_found" },
      });
    });

    it("answers bookings.not_found for a resource that does not exist", async () => {
      const result = await world(vertical).client.call(
        "bookings.create",
        createInput({ resourceIds: ["ghost"] }),
        key(),
      );
      expect(result).toMatchObject({ ok: false, error: { code: "bookings.not_found" } });
    });

    it("refuses a party the chosen resource cannot seat", async () => {
      const input = createInput({ resourceIds: [p.tooSmall.resourceId], partySize: p.tooSmall.partySize });
      expect(await world(vertical).client.call("bookings.create", input, key())).toMatchObject({
        ok: false,
        error: { code: "bookings.not_enough_seats" },
      });
    });

    it("refuses a resource that an open booking holds during the stay", async () => {
      const input = createInput({ resourceIds: [p.busy.resourceId], startMin: p.busy.at });
      expect(await world(vertical).client.call("bookings.create", input, key())).toMatchObject({
        ok: false,
        error: { code: "bookings.resource_busy" },
      });
    });

    it("refuses a second booking on the same resource at the same time", async () => {
      const { client } = world(vertical);
      await client.call("bookings.create", createInput(), key());
      expect(await client.call("bookings.create", createInput({ contactName: "Second" }), key())).toMatchObject({
        ok: false,
        error: { code: "bookings.resource_busy" },
      });
    });

    it("accepts a booking that starts exactly when the previous stay ends", async () => {
      const { client } = world(vertical);
      await client.call("bookings.create", createInput(), key());
      const next = createInput({ startMin: p.freeAt + p.stay, contactName: "Next" });
      expect(await client.call("bookings.create", next, key())).toMatchObject({ ok: true });
    });

    it("refuses a start outside the service window", async () => {
      expect(
        await world(vertical).client.call("bookings.create", createInput({ startMin: p.outside }), key()),
      ).toMatchObject({
        ok: false,
        error: { code: "bookings.outside_window" },
      });
    });

    it("refuses a start that is not on the slot grid", async () => {
      expect(
        await world(vertical).client.call("bookings.create", createInput({ startMin: p.offGrid }), key()),
      ).toMatchObject({
        ok: false,
        error: { code: "bookings.off_grid" },
      });
    });

    it("books without a resource and checks no seats", async () => {
      const input = createInput({ resourceIds: [], partySize: 12 });
      expect(await world(vertical).client.call("bookings.create", input, key())).toMatchObject({ ok: true });
    });

    it("refuses a create without an idempotency key", async () => {
      expect(await world(vertical).client.call("bookings.create", createInput())).toMatchObject({
        ok: false,
        error: { code: "client.idempotency_required" },
      });
    });

    it("returns the first booking when the same key is replayed, and applies it once", async () => {
      const { client } = world(vertical);
      const options = key();
      const first = await client.call("bookings.create", createInput(), options);
      const second = await client.call("bookings.create", createInput(), options);
      const ids = await listIds(client);
      expect([second, ids.filter((id) => id === bookingOf(first).id)]).toEqual([first, [bookingOf(first).id]]);
    });

    it("refuses a key reused with a different input", async () => {
      const { client } = world(vertical);
      const options = key();
      await client.call("bookings.create", createInput(), options);
      expect(await client.call("bookings.create", createInput({ contactName: "Other" }), options)).toMatchObject({
        ok: false,
        error: { code: "client.idempotency_conflict" },
      });
    });
  });

  describe("availability and the day filter", () => {
    it("lists every slot of the service window on the grid", async () => {
      expect(await slotsOf(world(vertical).client, 1)).toHaveLength(p.slotCount);
    });

    it("offers a free resource at its slot and withholds it once a booking holds it", async () => {
      const { client } = world(vertical);
      const before = (await slotsOf(client, 1)).find((slot) => slot.startMin === p.freeAt);
      await client.call("bookings.create", createInput(), key());
      const after = (await slotsOf(client, 1)).find((slot) => slot.startMin === p.freeAt);
      expect([before?.resourceIds.includes(p.free), after?.resourceIds.includes(p.free)]).toEqual([true, false]);
    });

    it("withholds a resource that is busy in the slot's stay", async () => {
      const slot = (await slotsOf(world(vertical).client, 1)).find((candidate) => candidate.startMin === p.busy.at);
      expect(slot?.resourceIds).not.toContain(p.busy.resourceId);
    });

    it("offers only resources that seat the whole party", async () => {
      const slot = (await slotsOf(world(vertical).client, p.tooSmall.partySize)).find(
        (candidate) => candidate.startMin === p.freeAt,
      );
      expect(slot?.resourceIds).not.toContain(p.tooSmall.resourceId);
    });

    it("ends each slot's stay at the stay length", async () => {
      const slot = (await slotsOf(world(vertical).client, 1)).find((candidate) => candidate.startMin === p.freeAt);
      expect(slot?.endMin).toBe(p.freeAt + p.stay);
    });

    it("lists only the bookings of the asked business day", async () => {
      const { client } = world(vertical);
      const created = bookingOf(
        await client.call("bookings.create", createInput({ businessDay: "2026-11-01" }), key()),
      );
      expect([await listIds(client, "2026-11-01"), await listIds(client)]).toEqual([
        [created.id],
        expect.not.arrayContaining([created.id]),
      ]);
    });

    it("lists the current business day when none is asked", async () => {
      const { client } = world(vertical);
      const listed = successValue(await client.call("bookings.list", { limit: 200 })) as { items: unknown[] };
      expect(listed.items).toHaveLength((await listIds(client)).length);
    });

    it("pages a day's bookings with a cursor", async () => {
      const { client } = world(vertical);
      const first = successValue(await client.call("bookings.list", { businessDay: DAY, limit: 1 })) as {
        nextCursor: string | null;
      };
      expect(first.nextCursor === null).toBe(SEEDS[vertical].bookings.length === 1);
    });
  });

  describe("reschedule", () => {
    it("does not count the booking itself as a conflict when only its party changes", async () => {
      const { client } = world(vertical);
      const created = bookingOf(await client.call("bookings.create", createInput(), key()));
      expect(await client.call("bookings.reschedule", { id: created.id, partySize: 1 })).toMatchObject({ ok: true });
    });

    it("refuses a party the booking's resource cannot seat", async () => {
      const { client } = world(vertical);
      const created = bookingOf(await client.call("bookings.create", createInput(), key()));
      const partySize = p.tooSmall.partySize + 20;
      expect(await client.call("bookings.reschedule", { id: created.id, partySize })).toMatchObject({
        ok: false,
        error: { code: "bookings.not_enough_seats" },
      });
    });

    it("moves the start and keeps the length of the stay", async () => {
      const { client } = world(vertical);
      const created = bookingOf(await client.call("bookings.create", createInput(), key()));
      const moved = bookingOf(await client.call("bookings.reschedule", { id: created.id, startMin: p.freeAt - 60 }));
      expect([moved.startMin, moved.endMin]).toEqual([p.freeAt - 60, p.freeAt - 60 + p.stay]);
    });

    it("refuses a new start outside the window", async () => {
      const { client } = world(vertical);
      const created = bookingOf(await client.call("bookings.create", createInput(), key()));
      expect(await client.call("bookings.reschedule", { id: created.id, startMin: p.outside })).toMatchObject({
        ok: false,
        error: { code: "bookings.outside_window" },
      });
    });

    it("refuses a new start off the grid", async () => {
      const { client } = world(vertical);
      const created = bookingOf(await client.call("bookings.create", createInput(), key()));
      expect(await client.call("bookings.reschedule", { id: created.id, startMin: p.offGrid })).toMatchObject({
        ok: false,
        error: { code: "bookings.off_grid" },
      });
    });

    it("answers the booking as it is when the same reschedule is repeated", async () => {
      const { client } = world(vertical);
      const created = bookingOf(await client.call("bookings.create", createInput(), key()));
      const change = { id: created.id, startMin: p.freeAt - 60 };
      const first = await client.call("bookings.reschedule", change);
      expect(await client.call("bookings.reschedule", change)).toEqual(first);
    });

    it("answers bookings.not_found for an unknown booking", async () => {
      expect(await world(vertical).client.call("bookings.reschedule", { id: "ghost", partySize: 1 })).toMatchObject({
        ok: false,
        error: { code: "bookings.not_found" },
      });
    });
  });

  describe("table assignment", () => {
    it("moves a booking to a free resource", async () => {
      const { client } = world(vertical);
      const created = bookingOf(await client.call("bookings.create", createInput({ resourceIds: [] }), key()));
      const moved = await client.call("bookings.table.assign", { id: created.id, resourceIds: [p.free] });
      expect(bookingOf(moved).resourceIds).toEqual([p.free]);
    });

    it("refuses to move a booking onto a busy resource", async () => {
      const { client } = world(vertical);
      const created = bookingOf(
        await client.call("bookings.create", createInput({ resourceIds: [], startMin: p.busy.at }), key()),
      );
      expect(
        await client.call("bookings.table.assign", { id: created.id, resourceIds: [p.busy.resourceId] }),
      ).toMatchObject({ ok: false, error: { code: "bookings.resource_busy" } });
    });

    it("leaves the start and the party as they were", async () => {
      const { client } = world(vertical);
      const created = bookingOf(await client.call("bookings.create", createInput({ resourceIds: [] }), key()));
      const moved = bookingOf(await client.call("bookings.table.assign", { id: created.id, resourceIds: [p.free] }));
      expect([moved.startMin, moved.endMin, moved.partySize]).toEqual([
        created.startMin,
        created.endMin,
        created.partySize,
      ]);
    });

    it("answers the booking as it is when the same assignment is repeated", async () => {
      const { client } = world(vertical);
      const created = bookingOf(await client.call("bookings.create", createInput({ resourceIds: [] }), key()));
      const change = { id: created.id, resourceIds: [p.free] };
      const first = await client.call("bookings.table.assign", change);
      expect(await client.call("bookings.table.assign", change)).toEqual(first);
    });

    it("answers bookings.not_found for an unknown booking", async () => {
      expect(
        await world(vertical).client.call("bookings.table.assign", { id: "ghost", resourceIds: [] }),
      ).toMatchObject({ ok: false, error: { code: "bookings.not_found" } });
    });
  });

  describe("staff notes", () => {
    it("adds a note and leaves the guest's note and the rest as they were", async () => {
      const { client } = world(vertical);
      const created = bookingOf(await client.call("bookings.create", createInput({ guestNote: "Window" }), key()));
      const noted = bookingOf(await client.call("bookings.staff_note.add", { id: created.id, text: "Regular" }, key()));
      expect([noted.staffNote, noted.guestNote, noted.startMin]).toEqual(["Regular", "Window", p.freeAt]);
    });

    it("appends to the notes already there", async () => {
      const { client } = world(vertical);
      const created = bookingOf(await client.call("bookings.create", createInput(), key()));
      await client.call("bookings.staff_note.add", { id: created.id, text: "Regular" }, key());
      const noted = bookingOf(await client.call("bookings.staff_note.add", { id: created.id, text: "Allergy" }, key()));
      expect(noted.staffNote).toBe("Regular\nAllergy");
    });

    it("adds the note once for a replayed key", async () => {
      const { client } = world(vertical);
      const created = bookingOf(await client.call("bookings.create", createInput(), key()));
      const options = key();
      await client.call("bookings.staff_note.add", { id: created.id, text: "Regular" }, options);
      const again = bookingOf(
        await client.call("bookings.staff_note.add", { id: created.id, text: "Regular" }, options),
      );
      expect(again.staffNote).toBe("Regular");
    });

    it("answers bookings.not_found for an unknown booking", async () => {
      expect(
        await world(vertical).client.call("bookings.staff_note.add", { id: "ghost", text: "x" }, key()),
      ).toMatchObject({ ok: false, error: { code: "bookings.not_found" } });
    });
  });

  describe("cancel and no-show", () => {
    it("cancels with the reason and releases the resource for another booking", async () => {
      const { client } = world(vertical);
      const created = bookingOf(await client.call("bookings.create", createInput(), key()));
      const cancelled = bookingOf(
        await client.call("bookings.cancel", { id: created.id, reason: "  Guest called " }, key()),
      );
      const again = await client.call("bookings.create", createInput({ contactName: "Next" }), key());
      expect([cancelled.status, cancelled.cancelReason, cancelled.resourceIds, again]).toEqual([
        "cancelled",
        "Guest called",
        [],
        expect.objectContaining({ ok: true }),
      ]);
    });

    it("refuses a cancel without a reason", async () => {
      const { client } = world(vertical);
      expect(await client.call("bookings.cancel", { id: p.lateConfirmed, reason: "  " }, key())).toMatchObject({
        ok: false,
        error: { code: "schema.invalid_input" },
      });
    });

    it("marks a late confirmed booking as a no-show, keeps the reason and releases its resources", async () => {
      const { client } = world(vertical);
      const marked = bookingOf(
        await client.call("bookings.no_show.mark", { id: p.lateConfirmed, reason: "No call" }, key()),
      );
      expect([marked.status, marked.noShowReason, marked.resourceIds]).toEqual(["no_show", "No call", []]);
    });

    it("refuses a no-show before the booking counts as late", async () => {
      const { client } = world(vertical);
      const created = bookingOf(await client.call("bookings.create", createInput(), key()));
      expect(await client.call("bookings.no_show.mark", { id: created.id }, key())).toMatchObject({
        ok: false,
        error: { code: "bookings.too_early" },
      });
    });

    it("counts a booking as late exactly at its start plus the late-after minutes", async () => {
      const { clientAt } = world(vertical);
      const created = bookingOf(await clientAt(0).call("bookings.create", createInput(), key()));
      expect(await clientAt(p.freeAt + 10).call("bookings.no_show.mark", { id: created.id }, key())).toMatchObject({
        ok: true,
      });
    });

    it("refuses a no-show one minute before it counts as late", async () => {
      const { clientAt } = world(vertical);
      const created = bookingOf(await clientAt(0).call("bookings.create", createInput(), key()));
      expect(await clientAt(p.freeAt + 9).call("bookings.no_show.mark", { id: created.id }, key())).toMatchObject({
        ok: false,
        error: { code: "bookings.too_early" },
      });
    });
  });

  describe("walk-in", () => {
    const seatInput = { partySize: 1, resourceIds: [p.free] };
    const now = CLOCKS[vertical].nowMin;

    it("seats a walk-in now for the walk-in stay on the current business day", async () => {
      const seated = bookingOf(await world(vertical).client.call("bookings.walk_in.seat", seatInput, key()));
      expect(seated).toMatchObject({
        origin: "walk_in",
        status: "in_progress",
        businessDay: DAY,
        startMin: now,
        endMin: now + p.stay,
        resourceIds: [p.free],
      });
    });

    it("keeps the contact name of a walk-in", async () => {
      const input = { ...seatInput, contactName: "Rey" };
      expect(bookingOf(await world(vertical).client.call("bookings.walk_in.seat", input, key()))).toMatchObject({
        contactName: "Rey",
      });
    });

    it("lists the walk-in in the same session", async () => {
      const { client } = world(vertical);
      const seated = bookingOf(await client.call("bookings.walk_in.seat", seatInput, key()));
      expect(await listIds(client)).toContain(seated.id);
    });

    it("refuses to seat on a resource that is taken", async () => {
      const { client } = world(vertical);
      await client.call("bookings.walk_in.seat", seatInput, key());
      expect(await client.call("bookings.walk_in.seat", seatInput, key())).toMatchObject({
        ok: false,
        error: { code: "bookings.resource_busy" },
      });
    });

    it("refuses a party the resource cannot seat", async () => {
      const input = { partySize: p.tooSmall.partySize, resourceIds: [p.tooSmall.resourceId] };
      expect(await world(vertical).client.call("bookings.walk_in.seat", input, key())).toMatchObject({
        ok: false,
        error: { code: "bookings.not_enough_seats" },
      });
    });

    it("returns the same walk-in for a replayed key and seats once", async () => {
      const { client } = world(vertical);
      const options = key();
      const first = await client.call("bookings.walk_in.seat", seatInput, options);
      const second = await client.call("bookings.walk_in.seat", seatInput, options);
      expect([second, (await listIds(client)).filter((id) => id === bookingOf(first).id)]).toEqual([
        first,
        [bookingOf(first).id],
      ]);
    });

    it("undoes a walk-in within the window, so it is as if it never happened", async () => {
      const { client, clientAt } = world(vertical);
      const seated = bookingOf(await client.call("bookings.walk_in.seat", seatInput, key()));
      const undone = await clientAt(now + 1).call("bookings.walk_in.undo", { id: seated.id }, key());
      expect([undone, await listIds(client)]).toEqual([
        { ok: true, value: { id: seated.id } },
        expect.not.arrayContaining([seated.id]),
      ]);
    });

    it("frees the resource again after an undo", async () => {
      const { client } = world(vertical);
      const seated = bookingOf(await client.call("bookings.walk_in.seat", seatInput, key()));
      await client.call("bookings.walk_in.undo", { id: seated.id }, key());
      expect(await client.call("bookings.walk_in.seat", seatInput, key())).toMatchObject({ ok: true });
    });

    it("refuses an undo once the window has passed on the business clock", async () => {
      const { client, clientAt } = world(vertical);
      const seated = bookingOf(await client.call("bookings.walk_in.seat", seatInput, key()));
      expect(await clientAt(now + 2).call("bookings.walk_in.undo", { id: seated.id }, key())).toMatchObject({
        ok: false,
        error: { code: "bookings.undo_expired" },
      });
    });

    it("keeps the walk-in when the undo is refused", async () => {
      const { client, clientAt } = world(vertical);
      const seated = bookingOf(await client.call("bookings.walk_in.seat", seatInput, key()));
      await clientAt(now + 5).call("bookings.walk_in.undo", { id: seated.id }, key());
      expect(await listIds(client)).toContain(seated.id);
    });

    it("refuses to undo a booking that was not a walk-in", async () => {
      expect(await world(vertical).client.call("bookings.walk_in.undo", { id: p.lateConfirmed }, key())).toMatchObject({
        ok: false,
        error: { code: "bookings.not_walk_in" },
      });
    });

    it("refuses to undo a walk-in that has moved on", async () => {
      const { client } = world(vertical);
      const seated = bookingOf(await client.call("bookings.walk_in.seat", seatInput, key()));
      await client.call("bookings.status.advance", { id: seated.id, to: "completed" }, key());
      expect(await client.call("bookings.walk_in.undo", { id: seated.id }, key())).toMatchObject({
        ok: false,
        error: { code: "bookings.invalid_transition" },
      });
    });

    it("refuses to undo an unknown walk-in", async () => {
      expect(await world(vertical).client.call("bookings.walk_in.undo", { id: "ghost" }, key())).toMatchObject({
        ok: false,
        error: { code: "bookings.not_found" },
      });
    });
  });

  describe("status steps", () => {
    const now = CLOCKS[vertical].nowMin;
    const advanceInput = { id: p.lateConfirmed, to: "in_progress" } as const;

    it("takes back a forward step within the undo window, returning the status it left", async () => {
      const { client, clientAt } = world(vertical);
      const advanced = bookingOf(await client.call("bookings.status.advance", advanceInput, key()));
      const undone = bookingOf(await clientAt(now + 1).call("bookings.status.undo", { id: advanced.id }, key()));
      expect([advanced.status, undone.status, undone.lastStep]).toEqual(["in_progress", "confirmed", undefined]);
    });

    it("takes back the original step after the advance was repeated", async () => {
      const { client, clientAt } = world(vertical);
      await client.call("bookings.status.advance", advanceInput, key());
      await client.call("bookings.status.advance", advanceInput, key());
      const undone = bookingOf(await clientAt(now + 1).call("bookings.status.undo", { id: p.lateConfirmed }, key()));
      expect(undone.status).toBe("confirmed");
    });

    it("refuses to take a step back once the window has passed", async () => {
      const { client, clientAt } = world(vertical);
      await client.call("bookings.status.advance", advanceInput, key());
      expect(await clientAt(now + 5).call("bookings.status.undo", { id: p.lateConfirmed }, key())).toMatchObject({
        ok: false,
        error: { code: "bookings.status_undo_expired" },
      });
    });

    it("keeps the new status when the undo is refused", async () => {
      const { client, clientAt } = world(vertical);
      await client.call("bookings.status.advance", advanceInput, key());
      await clientAt(now + 5).call("bookings.status.undo", { id: p.lateConfirmed }, key());
      const listed = successValue(await client.call("bookings.list", { businessDay: DAY, limit: 200 })) as {
        items: { id: string; status: string }[];
      };
      expect(listed.items.find((item) => item.id === p.lateConfirmed)?.status).toBe("in_progress");
    });

    it("has nothing to take back on a booking that never moved", async () => {
      expect(await world(vertical).client.call("bookings.status.undo", { id: p.lateConfirmed }, key())).toMatchObject({
        ok: false,
        error: { code: "bookings.invalid_transition" },
      });
    });

    it("takes back only the last step: a second undo has nothing left", async () => {
      const { client } = world(vertical);
      await client.call("bookings.status.advance", advanceInput, key());
      await client.call("bookings.status.undo", { id: p.lateConfirmed }, key());
      expect(await client.call("bookings.status.undo", { id: p.lateConfirmed }, key())).toMatchObject({
        ok: false,
        error: { code: "bookings.invalid_transition" },
      });
    });

    it("answers bookings.not_found for an unknown booking", async () => {
      expect(await world(vertical).client.call("bookings.status.undo", { id: "ghost" }, key())).toMatchObject({
        ok: false,
        error: { code: "bookings.not_found" },
      });
    });

    it("advances once for a replayed key: the replay returns the first answer", async () => {
      const { client } = world(vertical);
      const options = key();
      const first = await client.call("bookings.status.advance", advanceInput, options);
      const second = await client.call("bookings.status.advance", advanceInput, options);
      expect(second).toEqual(first);
    });

    it("cancels once for a replayed key: the replay returns the first answer and changes nothing", async () => {
      const { client } = world(vertical);
      const options = key();
      const input = { id: p.lateConfirmed, reason: "Guest called" };
      const first = await client.call("bookings.cancel", input, options);
      const second = await client.call("bookings.cancel", input, options);
      expect([second, bookingOf(first).status]).toEqual([first, "cancelled"]);
    });

    it("marks a no-show once for a replayed key", async () => {
      const { client } = world(vertical);
      const options = key();
      const first = await client.call("bookings.no_show.mark", { id: p.lateConfirmed }, options);
      const second = await client.call("bookings.no_show.mark", { id: p.lateConfirmed }, options);
      expect(second).toEqual(first);
    });
  });

  describe("permissions", () => {
    const writes = [
      ["bookings.create", createInput()],
      ["bookings.reschedule", { id: p.lateConfirmed, partySize: 1 }],
      ["bookings.table.assign", { id: p.lateConfirmed, resourceIds: [] }],
      ["bookings.staff_note.add", { id: p.lateConfirmed, text: "x" }],
      ["bookings.status.advance", { id: p.lateConfirmed, to: "in_progress" }],
      ["bookings.status.undo", { id: p.lateConfirmed }],
      ["bookings.cancel", { id: p.lateConfirmed, reason: "r" }],
      ["bookings.no_show.mark", { id: p.lateConfirmed }],
      ["bookings.walk_in.seat", { partySize: 1, resourceIds: [p.free] }],
      ["bookings.walk_in.undo", { id: p.lateConfirmed }],
    ] as const;

    it.each(writes)("is forbidden to call %s with only read:bookings", async (id, input) => {
      const reader = world(vertical).clientAt(CLOCKS[vertical].nowMin, ["read:bookings"]);
      expect(await reader.call(id, input, key())).toMatchObject({ ok: false, error: { code: "access.forbidden" } });
    });
  });

  describe("seed", () => {
    const seed = SEEDS[vertical].bookings as readonly BookingInput[];
    const resources = SEEDS[vertical].resources;
    const open = seed.filter(
      (candidate) =>
        candidate.status !== "cancelled" && candidate.status !== "no_show" && candidate.status !== "completed",
    );

    it("books only existing, active resources", () => {
      const usable = new Set(resources.filter((resource) => resource.active).map((resource) => resource.id));
      expect(seed.flatMap((entry) => entry.resourceIds).filter((id) => !usable.has(id))).toEqual([]);
    });

    it("seats every open booking's party at its resources", () => {
      const seats = (entry: BookingInput) =>
        entry.resourceIds.reduce((sum, id) => sum + (resources.find((r) => r.id === id)?.capacity ?? 1), 0);
      expect(
        open
          .filter((entry) => entry.resourceIds.length > 0 && seats(entry) < (entry.partySize ?? 1))
          .map((entry) => entry.id),
      ).toEqual([]);
    });

    it("double-books no resource between open bookings", () => {
      const clashes = open.flatMap((a) =>
        open
          .filter((b) => a.id < b.id && a.startMin < b.endMin && b.startMin < a.endMin)
          .filter((b) => a.resourceIds.some((id) => b.resourceIds.includes(id)))
          .map((b) => `${a.id}/${b.id}`),
      );
      expect(clashes).toEqual([]);
    });
  });
});

describe("booking status transitions", () => {
  const allowed = [
    ["pending", "confirmed"],
    ["awaiting_payment", "confirmed"],
    ["confirmed", "in_progress"],
    ["in_progress", "completed"],
  ] as const;

  const refused = [
    ["pending", "in_progress"],
    ["pending", "completed"],
    ["pending", "cancelled"],
    ["pending", "no_show"],
    ["awaiting_payment", "in_progress"],
    ["confirmed", "completed"],
    ["confirmed", "cancelled"],
    ["confirmed", "no_show"],
    ["in_progress", "confirmed"],
    ["in_progress", "no_show"],
    ["completed", "in_progress"],
    ["cancelled", "confirmed"],
    ["no_show", "confirmed"],
    ["cancelled", "cancelled"],
    ["no_show", "no_show"],
  ] as const;

  const everyStatus = bookingStatuses.map((status) => booking(status));
  const advance = (from: BookingStatus, to: BookingStatus) =>
    world("hospitality", hospitalityWith(everyStatus)).client.call(
      "bookings.status.advance",
      { id: `b-${from}`, to },
      key(),
    );

  it.each(allowed)("moves %s to %s", async (from, to) => {
    expect(bookingOf(await advance(from, to)).status).toBe(to);
  });

  it.each(["pending", "awaiting_payment", "confirmed", "in_progress", "completed"] as const)(
    "answers the booking as it is when it is already %s",
    async (status) => {
      const { client } = world("hospitality", hospitalityWith(everyStatus));
      const answer = bookingOf(await client.call("bookings.status.advance", { id: `b-${status}`, to: status }, key()));
      expect([answer.id, answer.status, "lastStep" in answer]).toEqual([`b-${status}`, status, false]);
    },
  );

  it("keeps the step to take back when an advance is repeated", async () => {
    const { client } = world("hospitality", hospitalityWith(everyStatus));
    const input = { id: "b-confirmed", to: "in_progress" } as const;
    const first = bookingOf(await client.call("bookings.status.advance", input, key()));
    const repeated = bookingOf(await client.call("bookings.status.advance", input, key()));
    expect(repeated).toEqual(first);
  });

  it.each(refused)("refuses %s to %s with bookings.invalid_transition", async (from, to) => {
    expect(await advance(from, to)).toMatchObject({ ok: false, error: { code: "bookings.invalid_transition" } });
  });

  it("has nothing to take back once the booking was cancelled after a step", async () => {
    const { client } = world("hospitality", hospitalityWith(everyStatus));
    await client.call("bookings.status.advance", { id: "b-pending", to: "confirmed" }, key());
    await client.call("bookings.cancel", { id: "b-pending", reason: "r" }, key());
    expect(await client.call("bookings.status.undo", { id: "b-pending" }, key())).toMatchObject({
      ok: false,
      error: { code: "bookings.invalid_transition" },
    });
  });

  it("answers bookings.not_found for an unknown booking", async () => {
    const result = await world("hospitality").client.call(
      "bookings.status.advance",
      { id: "ghost", to: "confirmed" },
      key(),
    );
    expect(result).toMatchObject({ ok: false, error: { code: "bookings.not_found" } });
  });

  it.each(["pending", "awaiting_payment", "confirmed"] as const)("cancels a %s booking", async (status) => {
    const { client } = world("hospitality", hospitalityWith(everyStatus));
    expect(bookingOf(await client.call("bookings.cancel", { id: `b-${status}`, reason: "r" }, key())).status).toBe(
      "cancelled",
    );
  });

  it("answers the cancelled booking as it is when cancelling again", async () => {
    const { client } = world("hospitality", hospitalityWith(everyStatus));
    const first = bookingOf(await client.call("bookings.cancel", { id: "b-confirmed", reason: "r" }, key()));
    const again = await client.call("bookings.cancel", { id: "b-confirmed", reason: "r" }, key());
    expect(bookingOf(again)).toEqual(first);
  });

  it("keeps the first reason when a cancel is repeated with another", async () => {
    const { client } = world("hospitality", hospitalityWith(everyStatus));
    await client.call("bookings.cancel", { id: "b-confirmed", reason: "first" }, key());
    const again = await client.call("bookings.cancel", { id: "b-confirmed", reason: "second" }, key());
    expect(bookingOf(again).cancelReason).toBe("first");
  });

  it.each(["in_progress", "completed", "no_show"] as const)("refuses to cancel a %s booking", async (status) => {
    const { client } = world("hospitality", hospitalityWith(everyStatus));
    expect(await client.call("bookings.cancel", { id: `b-${status}`, reason: "r" }, key())).toMatchObject({
      ok: false,
      error: { code: "bookings.invalid_transition" },
    });
  });

  it("answers the no-show booking as it is when marking it again", async () => {
    const { client } = world("hospitality", hospitalityWith(everyStatus));
    const again = await client.call("bookings.no_show.mark", { id: "b-no_show" }, key());
    expect(bookingOf(again)).toMatchObject({ id: "b-no_show", status: "no_show" });
  });

  it.each(["pending", "awaiting_payment", "in_progress", "completed", "cancelled"] as const)(
    "refuses a no-show from %s",
    async (status) => {
      const { client } = world("hospitality", hospitalityWith(everyStatus));
      expect(await client.call("bookings.no_show.mark", { id: `b-${status}` }, key())).toMatchObject({
        ok: false,
        error: { code: "bookings.invalid_transition" },
      });
    },
  );

  const closedChanges = [
    ["bookings.reschedule", { partySize: 1 }],
    ["bookings.table.assign", { resourceIds: [] }],
    ["bookings.staff_note.add", { text: "x" }],
  ] as const;

  describe.each(["completed", "cancelled", "no_show"] as const)("a %s booking", (status) => {
    it.each(closedChanges)("is refused by %s with bookings.closed", async (id, change) => {
      const { client } = world("hospitality", hospitalityWith(everyStatus));
      expect(await client.call(id, { id: `b-${status}`, ...change }, key())).toMatchObject({
        ok: false,
        error: { code: "bookings.closed" },
      });
    });
  });
});

describe("bookings with an inactive resource", () => {
  it("rejects the inactive resource with bookings.resource_inactive", async () => {
    const resources = hospitalitySeed.resources.map((resource) =>
      resource.id === "S6" ? { ...resource, active: false } : resource,
    );
    const { client } = world("hospitality", hospitalityWith([], resources));
    const input = {
      businessDay: DAY,
      startMin: 22 * 60,
      partySize: 2,
      resourceIds: ["S6"],
      contactName: "Rey",
      channel: "phone",
    };
    expect(await client.call("bookings.create", input, key())).toMatchObject({
      ok: false,
      error: { code: "bookings.resource_inactive" },
    });
  });

  it("does not offer an inactive resource in the availability", async () => {
    const resources = hospitalitySeed.resources.map((resource) =>
      resource.id === "S6" ? { ...resource, active: false } : resource,
    );
    const slots = await slotsOf(world("hospitality", hospitalityWith([], resources)).client, 5);
    expect(slots.flatMap((slot) => slot.resourceIds)).toEqual([]);
  });
});

describe("booking permissions by role", () => {
  const permissions = (index: 0 | 1 | 2) =>
    permissionsOf(DEFAULT_ROLES[index], CATALOG, VERTICALS.hospitality.modules) as readonly string[];

  it.each(["create:bookings", "update:bookings"])("lets staff hold %s, so a host can seat and book", (permission) => {
    expect(permissions(2)).toContain(permission);
  });

  it.each(["cancel:bookings", "noshow:bookings"])("keeps %s from staff, as a destructive permission", (permission) => {
    expect(permissions(2)).not.toContain(permission);
  });

  it.each(["cancel:bookings", "noshow:bookings"])("lets a manager hold %s", (permission) => {
    expect(permissions(1)).toContain(permission);
  });
});

describe("booking reads: get and search", () => {
  const customer = hospitalitySeed.customers[0];
  const stored = (id: string, extra: Partial<BookingInput>): BookingInput => ({
    ...booking("confirmed", id),
    ...extra,
  });
  const seeded = [
    stored("s1", { businessDay: "2026-11-01", startMin: 600, contactName: "Alice Ray", guestNote: "Birthday cake" }),
    stored("s2", { businessDay: "2026-11-01", startMin: 700, contactName: "Bob", staffNote: "Needs HIGHCHAIR" }),
    stored("s3", {
      businessDay: "2026-11-03",
      startMin: 600,
      contactName: undefined,
      customerId: customer?.id,
      tags: ["vip"],
    }),
    stored("s4", { businessDay: "2026-11-04", startMin: 600, contactName: "José Núñez" }),
  ];
  const reader = () => world("hospitality", hospitalityWith(seeded)).client;
  const idsOf = (result: CallResult<unknown>) =>
    (successValue(result) as { items: { id: string }[] }).items.map((item) => item.id);

  it("gets one booking by id", async () => {
    expect(bookingOf(await reader().call("bookings.get", { id: "s2" })).staffNote).toBe("Needs HIGHCHAIR");
  });

  it("answers bookings.not_found for an unknown id", async () => {
    expect(await reader().call("bookings.get", { id: "ghost" })).toMatchObject({
      ok: false,
      error: { code: "bookings.not_found" },
    });
  });

  it.each([
    ["customer", { customerId: customer?.id }, ["s3"]],
    ["a range starting on a day", { from: "2026-11-02" }, ["s3", "s4"]],
    ["a range ending on a day", { to: "2026-11-01" }, ["s1", "s2"]],
    ["a range of one day", { from: "2026-11-01", to: "2026-11-01" }, ["s1", "s2"]],
    ["text in a contact name, in any case", { text: "ALICE" }, ["s1"]],
    ["text in a guest note, which is never searched", { text: "birthday" }, []],
    ["text in a staff note, which is never searched", { text: "highchair" }, []],
    ["text in a name without its accents", { text: "jose nunez" }, ["s4"]],
    ["text in an accented name typed with accents", { text: "JOSÉ" }, ["s4"]],
    ["text in a tag", { text: "vip" }, ["s3"]],
    ["text in the customer's name", { text: customer?.name ?? "" }, ["s3"]],
    ["text and range together", { text: "bob", from: "2026-11-03" }, []],
    ["no filter, ordered by day then start", {}, ["s1", "s2", "s3", "s4"]],
  ])("searches by %s", async (_label, input, expected) => {
    expect(idsOf(await reader().call("bookings.search", input))).toEqual(expected);
  });

  it("pages with a cursor and says when there is more", async () => {
    const client = reader();
    const first = successValue(await client.call("bookings.search", { limit: 2 })) as { nextCursor: string };
    const second = await client.call("bookings.search", { limit: 2, cursor: first.nextCursor });
    expect(idsOf(second)).toEqual(["s3", "s4"]);
  });

  it("returns concise rows with no notes and no ext (AC8)", async () => {
    const rows = (successValue(await reader().call("bookings.search", { text: "bob" })) as { items: object[] }).items;
    expect(Object.keys(rows[0] ?? {}).sort()).toEqual([
      "businessDay",
      "contactName",
      "id",
      "partySize",
      "resourceIds",
      "startMin",
      "status",
      "tags",
    ]);
  });

  it("keeps the notes in bookings.get", async () => {
    expect(bookingOf(await reader().call("bookings.get", { id: "s1" })).guestNote).toBe("Birthday cake");
  });

  it.each([
    ["a limit above 50", { limit: 51 }],
    ["a range that ends before it starts", { from: "2026-11-03", to: "2026-11-01" }],
    ["blank text", { text: "  " }],
    ["an unknown filter", { status: "confirmed" }],
  ])("refuses %s", async (_label, input) => {
    expect(await reader().call("bookings.search", input as never)).toMatchObject({
      ok: false,
      error: { code: "schema.invalid_input" },
    });
  });

  it.each([
    ["bookings.get", { id: "s1" }],
    ["bookings.search", {}],
  ] as const)("is forbidden to call %s without read:bookings", async (id, input) => {
    const client = world("hospitality", hospitalityWith(seeded)).clientAt(CLOCKS.hospitality.nowMin, []);
    expect(await client.call(id, input)).toMatchObject({ ok: false, error: { code: "access.forbidden" } });
  });
});

describe("moving a booking in time and onto other tables", () => {
  const stored = (id: string, extra: Partial<BookingInput>): BookingInput => ({
    ...booking("confirmed", id),
    ...extra,
  });
  // "mine" sits on T1 from 20:00. T1 is taken from 21:00 and T2 until 21:00, so the move to 21:00 works only as a pair.
  const seeded = [
    stored("mine", { resourceIds: ["T1"], startMin: 1200, endMin: 1260 }),
    stored("block-t1", { resourceIds: ["T1"], startMin: 1260, endMin: 1320 }),
    stored("block-t2", { resourceIds: ["T2"], startMin: 1200, endMin: 1260 }),
  ];
  const client = (resources = hospitalitySeed.resources) =>
    world("hospitality", hospitalityWith(seeded, resources)).client;

  it("moves the time and the tables in one call", async () => {
    const moved = bookingOf(
      await client().call("bookings.reschedule", { id: "mine", startMin: 1260, resourceIds: ["T2"] }),
    );
    expect([moved.startMin, moved.endMin, moved.resourceIds]).toEqual([1260, 1320, ["T2"]]);
  });

  it("refuses the new time alone, because the booking's own table is taken then", async () => {
    expect(await client().call("bookings.reschedule", { id: "mine", startMin: 1260 })).toMatchObject({
      ok: false,
      error: { code: "bookings.resource_busy", details: { resourceIds: ["T1"] } },
    });
  });

  it("refuses the new table alone, because it is taken at the booking's time", async () => {
    expect(await client().call("bookings.table.assign", { id: "mine", resourceIds: ["T2"] })).toMatchObject({
      ok: false,
      error: { code: "bookings.resource_busy" },
    });
  });

  it("changes nothing when the pair is refused", async () => {
    const c = client();
    await c.call("bookings.reschedule", { id: "mine", startMin: 1260, resourceIds: ["T1"] });
    expect(bookingOf(await c.call("bookings.get", { id: "mine" }))).toMatchObject({
      startMin: 1200,
      resourceIds: ["T1"],
    });
  });

  it("refuses an inactive table with bookings.resource_inactive", async () => {
    const resources = hospitalitySeed.resources.map((r) => (r.id === "T3" ? { ...r, active: false } : r));
    expect(await client(resources).call("bookings.table.assign", { id: "mine", resourceIds: ["T3"] })).toMatchObject({
      ok: false,
      error: { code: "bookings.resource_inactive" },
    });
  });

  it("refuses a party the tables cannot seat with bookings.not_enough_seats", async () => {
    expect(await client().call("bookings.reschedule", { id: "mine", partySize: 4 })).toMatchObject({
      ok: false,
      error: { code: "bookings.not_enough_seats" },
    });
  });

  it("accepts joined tables whose seats add up to the party", async () => {
    const free = [stored("mine", { resourceIds: ["T1"], startMin: 1200, endMin: 1260 })];
    const c = world("hospitality", hospitalityWith(free)).client;
    const joined = bookingOf(
      await c.call("bookings.reschedule", { id: "mine", partySize: 4, resourceIds: ["T1", "T2"] }),
    );
    expect([joined.partySize, joined.resourceIds]).toEqual([4, ["T1", "T2"]]);
  });
});

describe("staff notes are bounded and applied once", () => {
  const stored = (staffNote?: string): BookingInput => ({
    ...booking("confirmed", "noted"),
    ...(staffNote === undefined ? {} : { staffNote }),
  });
  const clientWith = (staffNote?: string) => world("hospitality", hospitalityWith([stored(staffNote)])).client;

  it("refuses a line that would pass 2000 characters in all, and keeps the note", async () => {
    const c = clientWith("x".repeat(1990));
    const refused = await c.call("bookings.staff_note.add", { id: "noted", text: "y".repeat(20) }, key());
    expect([refused, bookingOf(await c.call("bookings.get", { id: "noted" })).staffNote?.length]).toMatchObject([
      { ok: false, error: { code: "bookings.staff_note_full" } },
      1990,
    ]);
  });

  it("accepts a line that fills the note exactly", async () => {
    const full = await clientWith("x".repeat(1990)).call(
      "bookings.staff_note.add",
      { id: "noted", text: "y".repeat(9) },
      key(),
    );
    expect(bookingOf(full).staffNote).toHaveLength(2000);
  });

  it("appends once when the same keyed call is sent five times in parallel", async () => {
    const c = clientWith();
    const options = key();
    await Promise.all(
      Array.from({ length: 5 }, () => c.call("bookings.staff_note.add", { id: "noted", text: "Regular" }, options)),
    );
    expect(bookingOf(await c.call("bookings.get", { id: "noted" })).staffNote).toBe("Regular");
  });

  it("reads a replayed note back from the store as it was written once", async () => {
    const c = clientWith();
    const options = key();
    await c.call("bookings.staff_note.add", { id: "noted", text: "Regular" }, options);
    await c.call("bookings.staff_note.add", { id: "noted", text: "Regular" }, options);
    expect(bookingOf(await c.call("bookings.get", { id: "noted" })).staffNote).toBe("Regular");
  });
});
