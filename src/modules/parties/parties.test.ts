import { describe, expect, it } from "vitest";

import { DEFAULT_ROLES, permissionsOf } from "@/core/access";
import { descriptorViolations } from "@/core/capability";
import { createClient } from "@/core/client";
import type { BusinessClock } from "@/core/clock";
import { createMockAdapter, createSessionStore } from "@/core/mock";
import type { CallResult } from "@/core/result";

import { partiesCapabilities, partiesCreate, partiesGet, partiesList, partiesUpdate } from "./capabilities";
import { partiesMockHandlers } from "./mock";
import { type Party, partySchema } from "./schema";

const clock: BusinessClock = {
  businessDay: "2026-10-31",
  today: "2026-10-31",
  nowMin: 600,
  cutoffMin: 0,
  timeZone: "Europe/Madrid",
};

const party = (id: string, roles: Party["roles"], extra: Partial<Party> = {}): Party => ({
  id,
  kind: "company",
  legalName: id,
  taxId: `B0000${id.length}`,
  addressLines: ["Calle 1"],
  countryCode: "ES",
  email: `${id}@demo.example`,
  roles,
  ...extra,
});

const fixture = [
  party("alpha", ["client"], { legalName: "Álamo Servicios S.L.", taxId: "B00000901" }),
  party("beta", ["supplier"], { legalName: "Beta Foods", tradeName: "Cañada Foods", taxId: "B00000902" }),
  party("gamma", ["client", "supplier"], { legalName: "Gamma S.A.", taxId: "A00000903" }),
];

const clientAs = (roleId: string, permissions: `${string}:${string}`[]) =>
  createClient(
    partiesCapabilities,
    // A demo session of its own, as the mock refuses a write without one (ADR 0005).
    createMockAdapter({
      handlers: partiesMockHandlers,
      store: createSessionStore({ parties: fixture }),
      clock,
      sessionId: `session-${roleId}`,
    }),
    {
      actor: { actorId: `demo-${roleId}`, roleId, permissions },
      retryDelayMs: 0,
      logger: () => undefined,
      mode: "production",
    },
  );

const client = clientAs("staff", ["read:parties"]);

const idsOf = (result: CallResult<unknown>): string[] => {
  if (!("ok" in result) || !result.ok) throw new Error(`Expected a success, got ${JSON.stringify(result)}`);
  return (result.value as { items: { id: string }[] }).items.map(({ id }) => id);
};

describe("parties.list", () => {
  it.each([partiesList, partiesGet, partiesCreate, partiesUpdate])(
    "passes the descriptor rules of $id",
    (capability) => {
      expect(descriptorViolations(capability)).toEqual([]);
    },
  );

  it("lists every party when no filter is given", async () => {
    expect(idsOf(await client.call("parties.list", {}))).toEqual(["alpha", "beta", "gamma"]);
  });

  it("keeps the parties holding the asked role, including those with both", async () => {
    expect(idsOf(await client.call("parties.list", { role: "supplier" }))).toEqual(["beta", "gamma"]);
  });

  it("searches the legal name without case or accents", async () => {
    expect(idsOf(await client.call("parties.list", { text: "alamo" }))).toEqual(["alpha"]);
  });

  it("searches the trade name", async () => {
    expect(idsOf(await client.call("parties.list", { text: "canada" }))).toEqual(["beta"]);
  });

  it("searches the tax ID", async () => {
    expect(idsOf(await client.call("parties.list", { text: "a0000090" }))).toEqual(["gamma"]);
  });

  it("combines the role and the text", async () => {
    expect(idsOf(await client.call("parties.list", { role: "client", text: "b0000090" }))).toEqual(["alpha"]);
  });

  it("pages with a cursor", async () => {
    const first = (await client.call("parties.list", { limit: 2 })) as { ok: true; value: { nextCursor: string } };
    expect(idsOf(await client.call("parties.list", { limit: 2, cursor: first.value.nextCursor }))).toEqual(["gamma"]);
  });
});

describe("parties.get", () => {
  it("returns the party with that id", async () => {
    expect(await client.call("parties.get", { id: "beta" })).toEqual({ ok: true, value: fixture[1] });
  });

  it("fails with parties.not_found for an unknown id", async () => {
    expect(await client.call("parties.get", { id: "ghost" })).toMatchObject({
      ok: false,
      error: { code: "parties.not_found" },
    });
  });
});

const winery: Omit<Party, "id"> = {
  kind: "company",
  legalName: "Bodegas del Interior S.L.",
  taxId: "B00000999",
  addressLines: ["Camino Viejo 2", "46340 Requena", "Spain"],
  countryCode: "ES",
  email: "pedidos@bodegas-interior.example",
  roles: ["supplier"],
};

describe("parties writes", () => {
  it("keeps the writes to the owner and the manager; staff only reads", () => {
    const held = DEFAULT_ROLES.map((role) => [
      role.id,
      permissionsOf(role, partiesCapabilities, ["parties"]).includes("manage:parties"),
    ]);
    expect(held).toEqual([
      ["owner", true],
      ["manager", true],
      ["staff", false],
    ]);
  });

  it("requires an idempotency key to create", () => {
    expect(partiesCreate).toMatchObject({ requiresIdempotencyKey: true });
  });

  it("refuses a create from staff", async () => {
    expect(await client.call("parties.create", winery, { idempotencyKey: "k-staff" })).toMatchObject({
      ok: false,
      error: { code: "access.forbidden" },
    });
  });

  it("creates a party the list then holds", async () => {
    const manager = clientAs("manager", ["read:parties", "manage:parties"]);
    const created = await manager.call("parties.create", winery, { idempotencyKey: "k-create" });
    expect(created).toMatchObject({ ok: true, value: { ...winery, id: expect.any(String) } });
    expect(idsOf(await manager.call("parties.list", { text: "B00000999" }))).toHaveLength(1);
  });

  it("refuses a create with no role", async () => {
    const manager = clientAs("manager", ["read:parties", "manage:parties"]);
    expect(await manager.call("parties.create", { ...winery, roles: [] }, { idempotencyKey: "k-none" })).toMatchObject({
      ok: false,
      error: { code: "schema.invalid_input" },
    });
  });

  it("changes the given fields, keeps the others and clears a null one", async () => {
    const manager = clientAs("manager", ["read:parties", "manage:parties"]);
    const result = await manager.call("parties.update", { id: "beta", email: "orders@beta.example", tradeName: null });
    expect(result).toEqual({
      ok: true,
      value: { ...fixture[1], email: "orders@beta.example", tradeName: undefined },
    });
  });

  it("fails with parties.not_found when updating an unknown id", async () => {
    const owner = clientAs("owner", ["read:parties", "manage:parties"]);
    expect(await owner.call("parties.update", { id: "ghost", email: "x@demo.example" })).toMatchObject({
      ok: false,
      error: { code: "parties.not_found" },
    });
  });
});

describe("partySchema", () => {
  it("refuses a party with no role", () => {
    expect(partySchema.safeParse(party("none", [])).success).toBe(false);
  });
});
