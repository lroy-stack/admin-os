import { describe, expect, it } from "vitest";

import { descriptorViolations } from "@/core/capability";
import { createClient } from "@/core/client";
import type { BusinessClock } from "@/core/clock";
import { assertDictionaryParity, errorText } from "@/core/i18n";
import { createMockAdapter, createSessionStore } from "@/core/mock";
import type { CallResult } from "@/core/result";

import { staffCapabilities } from "./capabilities";
import { staffErrors } from "./messages";
import { staffMockHandlers } from "./mock";
import type { Shift, StaffMember } from "./schema";

const clock: BusinessClock = {
  businessDay: "2026-10-31",
  today: "2026-10-31",
  nowMin: 600,
  cutoffMin: 0,
  timeZone: "Europe/Madrid",
};

const ana: StaffMember = {
  id: "ana",
  name: "Ana",
  roleIds: ["manager"],
  status: "active",
  locationIds: ["main"],
  skills: ["host"],
  contract: { type: "full_time", startDate: "2022-03-01", hoursPerWeek: 40 },
  ext: { crew: "floor" },
};

const bo: StaffMember = {
  id: "bo",
  name: "Bo",
  roleIds: ["staff"],
  status: "active",
  locationIds: ["main"],
  skills: [],
};

const shift = (id: string, staffId: string, businessDay: string, startMin: number): Shift => ({
  id,
  staffId,
  businessDay,
  startMin,
  endMin: startMin + 240,
});

// Seeded out of order, so the list has to sort by day and then by start.
const shifts = [
  shift("late-2nd", "ana", "2026-11-02", 900),
  shift("early-2nd", "ana", "2026-11-02", 480),
  shift("first", "ana", "2026-11-01", 600),
  shift("outside", "ana", "2026-12-15", 600),
  shift("other", "bo", "2026-11-01", 600),
];

const clientOn = (data: { readonly staff: StaffMember[]; readonly shifts?: Shift[] }) =>
  createClient(
    staffCapabilities,
    createMockAdapter({ handlers: staffMockHandlers, store: createSessionStore(data), clock }),
    {
      actor: { actorId: "demo-owner", roleId: "owner", permissions: ["read:staff", "read:staff.contracts"] },
      retryDelayMs: 0,
      logger: () => undefined,
      mode: "development",
    },
  );

const withShifts = clientOn({ staff: [ana, bo], shifts });
const withoutShifts = clientOn({ staff: [ana, bo] });

const successOf = (result: CallResult<unknown>): unknown => {
  if (!("ok" in result) || !result.ok) throw new Error(`Expected a success, got ${JSON.stringify(result)}`);
  return result.value;
};
const shiftIdsOf = (result: CallResult<unknown>) =>
  (successOf(result) as { items: { id: string }[] }).items.map(({ id }) => id);

describe("the staff capabilities", () => {
  it.each(Object.values(staffCapabilities))("$id passes the descriptor rules", (capability) => {
    expect(descriptorViolations(capability)).toEqual([]);
  });

  it("marks the contract read restricted and every other staff read not", () => {
    expect(Object.values(staffCapabilities).map(({ id, restricted }) => [id, restricted === true])).toEqual([
      ["staff.list", false],
      ["staff.get", false],
      ["staff.shifts.list", false],
      ["staff.contract.get", true],
    ]);
  });
});

describe("staff.get", () => {
  it("returns the member without their contract or ext", async () => {
    expect(successOf(await withShifts.call("staff.get", { id: "ana" }))).toEqual({
      id: "ana",
      name: "Ana",
      roleIds: ["manager"],
      status: "active",
      locationIds: ["main"],
      skills: ["host"],
    });
  });

  it("fails with staff.not_found for an unknown id", async () => {
    expect(await withShifts.call("staff.get", { id: "nobody" })).toEqual({
      ok: false,
      error: { code: "staff.not_found", message: "No team member with id nobody", details: { id: "nobody" } },
    });
  });
});

describe("staff.list", () => {
  it("leaves every contract and every ext out", async () => {
    const page = successOf(await withShifts.call("staff.list", {})) as { items: Record<string, unknown>[] };
    expect(page.items.map((item) => [Object.hasOwn(item, "contract"), Object.hasOwn(item, "ext")])).toEqual([
      [false, false],
      [false, false],
    ]);
  });
});

describe("staff.shifts.list", () => {
  it("returns the member's shifts in range, ordered by day and start", async () => {
    const result = await withShifts.call("staff.shifts.list", { staffId: "ana", from: "2026-11-01", to: "2026-11-30" });
    expect(shiftIdsOf(result)).toEqual(["first", "early-2nd", "late-2nd"]);
  });

  it("includes both ends of the range", async () => {
    const result = await withShifts.call("staff.shifts.list", { staffId: "ana", from: "2026-11-02", to: "2026-11-02" });
    expect(shiftIdsOf(result)).toEqual(["early-2nd", "late-2nd"]);
  });

  it("pages through the shifts", async () => {
    const first = successOf(
      await withShifts.call("staff.shifts.list", { staffId: "ana", from: "2026-11-01", to: "2026-11-30", limit: 2 }),
    ) as { nextCursor: string };
    const second = await withShifts.call("staff.shifts.list", {
      staffId: "ana",
      from: "2026-11-01",
      to: "2026-11-30",
      limit: 2,
      cursor: first.nextCursor,
    });
    expect(shiftIdsOf(second)).toEqual(["late-2nd"]);
  });

  it("answers an empty page on a preset that seeds no shifts", async () => {
    const result = await withoutShifts.call("staff.shifts.list", {
      staffId: "ana",
      from: "2026-11-01",
      to: "2026-11-30",
    });
    expect(successOf(result)).toEqual({ items: [], nextCursor: null });
  });

  it("fails with staff.not_found for an unknown member", async () => {
    const result = await withShifts.call("staff.shifts.list", {
      staffId: "nobody",
      from: "2026-11-01",
      to: "2026-11-02",
    });
    expect(result).toMatchObject({ ok: false, error: { code: "staff.not_found" } });
  });

  it("accepts a range of 31 days, both ends included", async () => {
    const result = await withShifts.call("staff.shifts.list", { staffId: "ana", from: "2026-11-01", to: "2026-12-01" });
    expect(result).toMatchObject({ ok: true });
  });

  it.each([
    ["to before from", { from: "2026-11-02", to: "2026-11-01" }, ["from"]],
    ["more than 31 days", { from: "2026-11-01", to: "2026-12-02" }, ["to"]],
    ["a day that is not on the calendar", { from: "2026-11-01", to: "2026-11-45" }, ["to"]],
    ["30 February", { from: "2026-02-01", to: "2026-02-30" }, ["to"]],
    ["31 April", { from: "2026-04-31", to: "2026-05-01" }, ["from"]],
    ["a missing range", {}, ["from", "to"]],
  ])("rejects %s with schema.invalid_input on the field to fix", async (_label, range, paths) => {
    expect(await withShifts.call("staff.shifts.list", { staffId: "ana", ...range } as never)).toMatchObject({
      ok: false,
      error: { code: "schema.invalid_input", details: { paths } },
    });
  });
});

describe("staff.contract.get", () => {
  it("returns the member's contract", async () => {
    expect(successOf(await withShifts.call("staff.contract.get", { staffId: "ana" }))).toEqual({
      contract: { type: "full_time", startDate: "2022-03-01", hoursPerWeek: 40 },
    });
  });

  it("answers null for a member with no contract on record", async () => {
    expect(successOf(await withShifts.call("staff.contract.get", { staffId: "bo" }))).toEqual({ contract: null });
  });

  it("fails with staff.not_found for an unknown member", async () => {
    expect(await withShifts.call("staff.contract.get", { staffId: "nobody" })).toMatchObject({
      ok: false,
      error: { code: "staff.not_found", details: { id: "nobody" } },
    });
  });
});

describe("staff error texts", () => {
  it("has the same keys in every locale", () => {
    expect(() => assertDictionaryParity(staffErrors)).not.toThrow();
  });

  it.each([
    ["en", "This team member no longer exists."],
    ["es", "Este miembro del equipo ya no existe."],
    ["de", "Dieses Teammitglied existiert nicht mehr."],
    ["fr", "Ce membre de l’équipe n’existe plus."],
  ] as const)("renders staff.not_found in %s", (locale, text) => {
    expect(errorText({ code: "staff.not_found" }, staffErrors, locale)).toBe(text);
  });
});
