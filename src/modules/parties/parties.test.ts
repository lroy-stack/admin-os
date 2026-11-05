import { describe, expect, it } from "vitest";

import { descriptorViolations } from "@/core/capability";
import { createClient } from "@/core/client";
import type { BusinessClock } from "@/core/clock";
import { createMockAdapter, createSessionStore } from "@/core/mock";
import type { CallResult } from "@/core/result";

import { partiesCapabilities, partiesGet, partiesList } from "./capabilities";
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

const client = createClient(
  partiesCapabilities,
  createMockAdapter({ handlers: partiesMockHandlers, store: createSessionStore({ parties: fixture }), clock }),
  {
    actor: { actorId: "demo-staff", roleId: "staff", permissions: ["read:parties"] },
    retryDelayMs: 0,
    logger: () => undefined,
    mode: "production",
  },
);

const idsOf = (result: CallResult<unknown>): string[] => {
  if (!("ok" in result) || !result.ok) throw new Error(`Expected a success, got ${JSON.stringify(result)}`);
  return (result.value as { items: { id: string }[] }).items.map(({ id }) => id);
};

describe("parties.list", () => {
  it.each([partiesList, partiesGet])("passes the descriptor rules of $id", (capability) => {
    expect(descriptorViolations(capability)).toEqual([]);
  });

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

describe("partySchema", () => {
  it("refuses a party with no role", () => {
    expect(partySchema.safeParse(party("none", [])).success).toBe(false);
  });
});
