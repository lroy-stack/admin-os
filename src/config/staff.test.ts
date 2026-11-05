import { describe, expect, it } from "vitest";

import { DEFAULT_ROLES, permissionsOf, type RoleId } from "@/core/access";
import { createClient } from "@/core/client";
import type { CallResult } from "@/core/result";

import { demoActor } from "./actor";
import { CATALOG } from "./catalog";
import { getAdapter } from "./data.server";
import { VERTICALS, type VerticalId } from "./vertical";

const quiet = { retryDelayMs: 0, logger: () => undefined, mode: "production" } as const;

/** Per preset, a seeded member whose seed carries a contract and an `ext` (salon's holds pay), and that contract. */
const presets = [
  ["hospitality", "staff-marta", { type: "full_time", startDate: "2022-03-01", hoursPerWeek: 40 }],
  ["salon", "stylist-ines", { type: "employee", startDate: "2021-09-01" }],
  ["workshop", "mech-rafa", { type: "employee", startDate: "2019-05-13", hoursPerWeek: 40 }],
] as const satisfies readonly (readonly [VerticalId, string, object])[];

const roles = DEFAULT_ROLES.map(({ id }) => id);

/** A fresh demo session for a role of the preset, with the permissions that role really holds there. */
const session = (vertical: VerticalId, roleId: RoleId) =>
  createClient(CATALOG, getAdapter({ vertical, sessionId: crypto.randomUUID() }), {
    ...quiet,
    actor: demoActor(roleId, VERTICALS[vertical]),
  });

const successOf = (result: CallResult<unknown>): unknown => {
  if (!("ok" in result) || !result.ok) throw new Error(`Expected a success, got ${JSON.stringify(result)}`);
  return result.value;
};

/** The restricted fields a staff read returned, at any depth the read nests records (ADR 0020 §4). */
const restrictedFieldsOf = (value: unknown): string[] =>
  ["contract", "ext"].filter((field) => JSON.stringify(value).includes(`"${field}"`));

describe("who holds read:staff.contracts (ADR 0006, ADR 0020 §4)", () => {
  it("is held by the owner and the manager, and not by staff", () => {
    expect(
      DEFAULT_ROLES.map((role) => [
        role.id,
        permissionsOf(role, CATALOG, VERTICALS.hospitality.modules).includes("read:staff.contracts"),
      ]),
    ).toEqual([
      ["owner", true],
      ["manager", true],
      ["staff", false],
    ]);
  });
});

describe.each(presets)("the team's capabilities in the %s preset", (vertical, memberId, contract) => {
  it("refuses staff.contract.get to staff with access.forbidden", async () => {
    expect(await session(vertical, "staff").call("staff.contract.get", { staffId: memberId })).toMatchObject({
      ok: false,
      error: { code: "access.forbidden" },
    });
  });

  it.each(["owner", "manager"] as const)("gives the %s the member's contract", async (roleId) => {
    expect(successOf(await session(vertical, roleId).call("staff.contract.get", { staffId: memberId }))).toEqual({
      contract,
    });
  });

  it.each(roles)("never returns contract or ext from staff.list for the %s", async (roleId) => {
    expect(restrictedFieldsOf(successOf(await session(vertical, roleId).call("staff.list", { limit: 200 })))).toEqual(
      [],
    );
  });

  it.each(roles)("never returns contract or ext from staff.get for the %s", async (roleId) => {
    expect(restrictedFieldsOf(successOf(await session(vertical, roleId).call("staff.get", { id: memberId })))).toEqual(
      [],
    );
  });

  it.each(roles)("never returns contract or ext from staff.shifts.list for the %s", async (roleId) => {
    const result = await session(vertical, roleId).call("staff.shifts.list", {
      staffId: memberId,
      from: "2026-10-26",
      to: "2026-11-01",
    });
    expect(restrictedFieldsOf(successOf(result))).toEqual([]);
  });
});

describe("a preset's seeded shifts", () => {
  it.each([
    ["hospitality", "staff-marta", ["shift-marta"]],
    ["salon", "stylist-ines", ["shift-ines"]],
    ["workshop", "mech-rafa", []],
  ] as const)("lists %s's shifts for %s, empty where none are seeded", async (vertical, staffId, ids) => {
    const result = await session(vertical, "staff").call("staff.shifts.list", {
      staffId,
      from: "2026-10-26",
      to: "2026-11-01",
    });
    expect((successOf(result) as { items: { id: string }[] }).items.map(({ id }) => id)).toEqual(ids);
  });
});
