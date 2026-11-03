import { describe, expect, it } from "vitest";

import { DEFAULT_ROLES, permissionsOf } from "@/core/access";
import { type Actor, createClient } from "@/core/client";
import type { CallResult } from "@/core/result";
import { customerSchema, duplicateMatchSchema } from "@/modules/customers";

import { CATALOG } from "./catalog";
import { getAdapter } from "./data.server";
import { VERTICALS, type VerticalId } from "./vertical";

const quiet = { retryDelayMs: 0, logger: () => undefined, mode: "production" } as const;

const presets = [
  ["hospitality", "C-iglesias", "+34600000101"],
  ["salon", "client-nora", "+34600000201"],
  ["workshop", "cust-carmen", "+34600000301"],
] as const satisfies readonly (readonly [VerticalId, string, string])[];

const actorFor = (vertical: VerticalId, permissions?: readonly string[]): Actor => ({
  actorId: "demo-owner",
  displayName: "Alex Morgan",
  roleId: "owner",
  permissions: permissions ?? permissionsOf(DEFAULT_ROLES[0], CATALOG, VERTICALS[vertical].modules),
});

const session = (vertical: VerticalId, permissions?: readonly string[], sessionId = crypto.randomUUID()) =>
  createClient(CATALOG, getAdapter({ vertical, sessionId }), { ...quiet, actor: actorFor(vertical, permissions) });

const key = () => ({ idempotencyKey: crypto.randomUUID() });

/** The catalogue is untyped per id, so a success is parsed with the module schema; anything else fails the test. */
const successOf = (result: CallResult<unknown>): unknown => {
  if (!("ok" in result) || !result.ok) throw new Error(`Expected a success, got ${JSON.stringify(result)}`);
  return result.value;
};
const customerOf = (result: CallResult<unknown>) => customerSchema.parse(successOf(result));
const matchesOf = (result: CallResult<unknown>) =>
  duplicateMatchSchema.array().parse((successOf(result) as { matches: unknown }).matches);

const listIds = async (client: ReturnType<typeof session>) =>
  customerSchema
    .array()
    .parse((successOf(await client.call("customers.list", { limit: 200 })) as { items: unknown }).items)
    .map((item) => item.id);

describe.each(presets)("customers writes in the %s preset", (vertical, existingId, existingPhone) => {
  it("creates a customer that customers.get and customers.list then return in the same session", async () => {
    const client = session(vertical);
    const created = await client.call("customers.create", { name: "New Contact", phone: "+34622222222" }, key());
    const { id } = customerOf(created);
    const [fetched, ids] = await Promise.all([client.call("customers.get", { id }), listIds(client)]);
    expect([customerOf(fetched).name, ids.includes(id)]).toEqual(["New Contact", true]);
  });

  it("does not show a customer created in one session to another", async () => {
    const created = await session(vertical).call("customers.create", { name: "Private" }, key());
    expect(await listIds(session(vertical))).not.toContain(customerOf(created).id);
  });

  it("returns the first result when the same idempotency key is replayed", async () => {
    const client = session(vertical);
    const options = key();
    const first = await client.call("customers.create", { name: "Once", phone: "+34633333333" }, options);
    const second = await client.call("customers.create", { name: "Once", phone: "+34633333333" }, options);
    expect(second).toEqual(first);
  });

  it("refuses a create without an idempotency key", async () => {
    expect(await session(vertical).call("customers.create", { name: "No key" })).toMatchObject({
      ok: false,
      error: { code: "client.idempotency_required" },
    });
  });

  it("refuses an exact duplicate by phone with a domain error that names the existing customer", async () => {
    const result = await session(vertical).call("customers.create", { name: "Twin", phone: existingPhone }, key());
    expect(result).toMatchObject({
      ok: false,
      error: { code: "customers.duplicate", details: { customerIds: [existingId], matchedOn: ["phone"] } },
    });
  });

  it("finds the existing customer by phone typed with spaces", async () => {
    const spaced = `${existingPhone.slice(0, 3)} ${existingPhone.slice(3)}`;
    const result = await session(vertical).call("customers.duplicates.check", { phone: spaced });
    expect(matchesOf(result).map((match) => match.customer.id)).toEqual([existingId]);
  });

  it("finds a created customer by email in another case", async () => {
    const client = session(vertical);
    await client.call("customers.create", { name: "Mail", email: "Mail@Example.com" }, key());
    const result = await client.call("customers.duplicates.check", { email: "mail@EXAMPLE.com" });
    expect(matchesOf(result).map((match) => match.matchedOn)).toEqual([["email"]]);
  });

  it("finds nothing for an unknown contact", async () => {
    expect(await session(vertical).call("customers.duplicates.check", { phone: "+34699999999" })).toEqual({
      ok: true,
      value: { matches: [] },
    });
  });

  it("updates only the patched fields", async () => {
    const updated = await session(vertical).call("customers.update", {
      id: existingId,
      patch: { name: "Renamed", vip: true },
    });
    expect(customerOf(updated)).toMatchObject({ name: "Renamed", vip: true, phone: existingPhone });
  });

  it("refuses to update a phone onto another customer's phone", async () => {
    const client = session(vertical);
    const created = await client.call("customers.create", { name: "Other", phone: "+34644444444" }, key());
    const { id } = customerOf(created);
    expect(await client.call("customers.update", { id, patch: { phone: existingPhone } })).toMatchObject({
      ok: false,
      error: { code: "customers.duplicate" },
    });
  });

  it("signs a note with the acting staff member", async () => {
    const result = await session(vertical).call(
      "customers.notes.add",
      { id: existingId, text: "Prefers mornings" },
      key(),
    );
    expect(customerOf(result).notes.at(-1)).toMatchObject({
      text: "Prefers mornings",
      authorId: "demo-owner",
      authorName: "Alex Morgan",
    });
  });

  it("blocks with a reason", async () => {
    const blocked = await session(vertical).call("customers.block", { id: existingId, reason: "Abusive" });
    expect(customerOf(blocked)).toMatchObject({ blocked: true, blockReason: "Abusive" });
  });

  it("clears the block reason when unblocking", async () => {
    const client = session(vertical);
    await client.call("customers.block", { id: existingId, reason: "Abusive" });
    const unblocked = await client.call("customers.unblock", { id: existingId });
    const customer = customerOf(unblocked);
    expect([customer.blocked, "blockReason" in customer]).toEqual([false, false]);
  });

  it("answers customers.not_found for an unknown id", async () => {
    expect(await session(vertical).call("customers.get", { id: "missing" })).toMatchObject({
      ok: false,
      error: { code: "customers.not_found" },
    });
  });

  it.each([
    ["customers.create", { name: "X" }],
    ["customers.update", { id: existingId, patch: { vip: true } }],
    ["customers.block", { id: existingId, reason: "r" }],
    ["customers.unblock", { id: existingId }],
  ] as const)("is forbidden to call %s with only read:customers", async (id, input) => {
    const reader = session(vertical, ["read:customers"]);
    expect(await reader.call(id, input, key())).toMatchObject({ ok: false, error: { code: "access.forbidden" } });
  });
});

describe("customers permissions by role", () => {
  const staff = permissionsOf(DEFAULT_ROLES[2], CATALOG, VERTICALS.hospitality.modules) as readonly string[];

  it.each(["create:customers", "update:customers", "block:customers"])("lets staff hold %s", (permission) => {
    expect(staff).toContain(permission);
  });

  it("keeps a seeded note readable as a dated entry", async () => {
    const ortega = await session("hospitality").call("customers.get", { id: "C-ortega" });
    expect(customerOf(ortega).notes.map((note) => note.text)).toEqual(["One guest is coeliac"]);
  });
});
