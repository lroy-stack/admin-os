import { describe, expect, it } from "vitest";

import { DEFAULT_ROLES, permissionsOf } from "@/core/access";
import { type Actor, type Adapter, createClient } from "@/core/client";
import { fixedClock } from "@/core/clock";
import { createMockAdapter, createSessionStore } from "@/core/mock";

import { CATALOG } from "./catalog";
import { DEMO, type DemoSeed, MOCK_HANDLERS, settingsFor } from "./demo-kernel";
import { VERTICALS, type VerticalId } from "./vertical";

const verticalIds = Object.keys(VERTICALS) as VerticalId[];
const capabilityIds = Object.keys(CATALOG);
const quiet = { retryDelayMs: 0, logger: () => undefined } as const;

const firstCustomer = { hospitality: "C-iglesias", salon: "client-nora", workshop: "cust-carmen" } as const;
const firstParty = { hospitality: "servicios-levante", salon: "hotel-spa", workshop: "fleet-company" } as const;

/** Per preset: a confirmed booking that counts as late on the seeded clock, a resource free at `freeAt`, a bookable slot. */
const bookable = {
  hospitality: { booking: "R-1046", resource: "S8", startMin: 22 * 60 },
  salon: { booking: "A-201", resource: "chair-3", startMin: 15 * 60 },
  workshop: { booking: "W-301", resource: "bay-1", startMin: 15 * 60 },
} as const;

/** The smallest valid input of each capability that needs one; the rest accept `{}`. */
export const inputFor = (id: string, vertical: VerticalId): Record<string, unknown> => {
  const customer = { id: firstCustomer[vertical] };
  const { booking, resource, startMin } = bookable[vertical];
  const inputs: Record<string, Record<string, unknown>> = {
    "customers.get": customer,
    "customers.search": { text: "ab" },
    "parties.get": { id: firstParty[vertical] },
    "approvals.get": { approvalId: "held" },
    "approvals.approve": { approvalId: "held" },
    "approvals.reject": { approvalId: "held" },
    "approvals.policy.set": { policy: "none" },
    "settings.values.update": {
      values: {
        "business.invoicing": {
          defaultTax: "vat",
          taxRates: { gst: 0, vat: 21, "service-tax": 5 },
          paymentTermsDays: 45,
        },
      },
    },
    "bookings.get": { id: booking },
    // `bookings.search` by text and `bookings.create` by customer id read the customers collection (ADR 0017 §3).
    "bookings.search": { text: "a" },
    "customers.create": { name: "Contract Test", phone: "+34611111111" },
    "parties.create": {
      kind: "company",
      legalName: "Contract Test S.L.",
      taxId: "B00000990",
      addressLines: ["Calle Contrato 1"],
      countryCode: "ES",
      email: "contract@demo.example",
      roles: ["client"],
    },
    "parties.update": { id: firstParty[vertical], email: "contract@demo.example" },
    "customers.contact.update": { ...customer, name: "Contract Test" },
    "customers.notes.add": { ...customer, text: "Called back" },
    "customers.block": { ...customer, reason: "No-show twice" },
    "customers.unblock": customer,
    "notifications.read": { ids: [`booking.late:${booking}`] },
    "bookings.availability.get": { businessDay: "2026-10-31", partySize: 2 },
    "bookings.create": {
      businessDay: "2026-10-31",
      startMin,
      partySize: 1,
      resourceIds: [resource],
      customerId: customer.id,
      channel: "phone",
    },
    "bookings.reschedule": { id: booking, partySize: 1 },
    "bookings.table.assign": { id: booking, resourceIds: [resource] },
    "bookings.staff_note.add": { id: booking, text: "Checked" },
    "bookings.status.advance": { id: booking, to: "in_progress" },
    "bookings.status.undo": { id: booking },
    "bookings.cancel": { id: booking, reason: "Guest called" },
    "bookings.no_show.mark": { id: booking },
    "bookings.walk_in.seat": { partySize: 1, resourceIds: [resource] },
    "bookings.walk_in.undo": { id: "bk-undo" },
  };
  return inputs[id] ?? {};
};

/** Undo needs a walk-in seated a moment ago, so the contract test seats one in the same session first. */
const seatedWalkIn = async (client: ReturnType<typeof createClient>, vertical: VerticalId) => {
  const seated = await client.call("bookings.walk_in.seat", inputFor("bookings.walk_in.seat", vertical), {
    idempotencyKey: crypto.randomUUID(),
  });
  return { id: "ok" in seated && seated.ok ? (seated.value as { id: string }).id : "seat-failed" };
};

/** A status step to take back: advance the booking first, as the capability needs a step on record. */
const advancedBooking = async (client: ReturnType<typeof createClient>, vertical: VerticalId) => {
  await client.call("bookings.status.advance", inputFor("bookings.status.advance", vertical), {
    idempotencyKey: crypto.randomUUID(),
  });
  return inputFor("bookings.status.undo", vertical);
};

/** A settings change asked by an assistant waits for a person under the default policy; the approvals take its id. */
const heldApproval = async (adapter: Adapter, vertical: VerticalId) => {
  const assistant = createClient(CATALOG, adapter, {
    ...quiet,
    actor: ownerOf(vertical),
    via: "mcp",
    mode: "production",
  });
  const held = await assistant.call("settings.values.update", inputFor("settings.values.update", vertical));
  return { approvalId: "approvalId" in held ? held.approvalId : "hold-failed" };
};

const HELD_WRITE_CAPABILITIES: readonly string[] = ["approvals.get", "approvals.approve", "approvals.reject"];

export const inputBeforeCall = (
  client: ReturnType<typeof createClient>,
  id: string,
  vertical: VerticalId,
  adapter: Adapter,
) => {
  if (HELD_WRITE_CAPABILITIES.includes(id)) return heldApproval(adapter, vertical);
  if (id === "bookings.walk_in.undo") return seatedWalkIn(client, vertical);
  if (id === "bookings.status.undo") return advancedBooking(client, vertical);
  return Promise.resolve(inputFor(id, vertical));
};

export const ownerOf = (vertical: VerticalId): Actor => ({
  actorId: "demo-owner",
  roleId: "owner",
  permissions: permissionsOf(DEFAULT_ROLES[0], CATALOG, VERTICALS[vertical].modules),
});

/** A session on the preset's seed without the given collections, as if their modules were not installed (ADR 0017 §3). */
export function sessionWithout(vertical: VerticalId, absent: ReadonlySet<string>) {
  const seed = Object.fromEntries(Object.entries(DEMO[vertical].seed).filter(([name]) => !absent.has(name)));
  const adapter = createMockAdapter({
    handlers: MOCK_HANDLERS,
    // The seed lacks the absent modules' collections, which an installed composition's types require: the point here.
    store: createSessionStore(seed as unknown as DemoSeed),
    sessionId: crypto.randomUUID(),
    clock: fixedClock(DEMO[vertical].clock),
    settings: settingsFor(vertical),
  });
  return {
    adapter,
    client: createClient(CATALOG, adapter, { ...quiet, mode: "production", actor: ownerOf(vertical) }),
  };
}

/** Everything a visitor can read in a preset, as one value, so two moments of a session can be compared. */
const stateOf = (client: ReturnType<typeof createClient>, ids: readonly string[], vertical: VerticalId) =>
  Promise.all(ids.map((id) => client.call(id, inputFor(id, vertical))));

/**
 * What every adapter answers (ADR 0008): the same suite runs against the in-memory kernel and the Durable Object.
 * An adapter whose state can be lost passes `evict`, which drops its in-memory state; then every write must leave
 * the same reads after it.
 */
export function describeAdapterContract(
  name: string,
  adapterFor: (vertical: VerticalId, sessionId: string) => Adapter,
  evict?: () => Promise<void>,
): void {
  describe(`the adapter contract (ADR 0008): ${name}`, () => {
    describe.each(verticalIds)("%s", (vertical) => {
      const enabled = new Set<string>([...VERTICALS[vertical].modules, "access", "approvals", "clock", "settings"]);
      const reachable = capabilityIds.filter((id) => enabled.has(id.split(".")[0] ?? ""));

      it.each(reachable)("answers %s with output that matches its schema", async (id) => {
        // Development mode throws on contract drift, so a seed or handler that breaks the schema fails here.
        const adapter = adapterFor(vertical, crypto.randomUUID());
        const client = createClient(CATALOG, adapter, {
          ...quiet,
          actor: ownerOf(vertical),
          mode: "development",
        });
        const input = await inputBeforeCall(client, id, vertical, adapter);
        expect(await client.call(id, input, { idempotencyKey: crypto.randomUUID() })).toMatchObject({ ok: true });
      });

      if (evict !== undefined) {
        const readIds = reachable.filter((id) => CATALOG[id]?.effect === "read");
        const writeIds = reachable.filter((id) => CATALOG[id]?.effect !== "read");

        it.each(writeIds)("keeps what %s wrote when the object is evicted", async (id) => {
          const adapter = adapterFor(vertical, crypto.randomUUID());
          const client = createClient(CATALOG, adapter, {
            ...quiet,
            actor: ownerOf(vertical),
            mode: "production",
          });
          const written = await client.call(id, await inputBeforeCall(client, id, vertical, adapter), {
            idempotencyKey: crypto.randomUUID(),
          });
          expect(written).toMatchObject({ ok: true });
          const before = await stateOf(client, readIds, vertical);

          await evict();

          expect(await stateOf(client, readIds, vertical)).toEqual(before);
        });
      }

      it.each(capabilityIds)("answers %s with access.forbidden for an actor without permissions", async (id) => {
        const client = createClient(CATALOG, adapterFor(vertical, crypto.randomUUID()), { ...quiet });
        expect(await client.call(id, inputFor(id, vertical), { idempotencyKey: crypto.randomUUID() })).toMatchObject({
          ok: false,
          error: { code: "access.forbidden" },
        });
      });
    });
  });
}
