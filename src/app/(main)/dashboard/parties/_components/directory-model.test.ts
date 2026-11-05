import { describe, expect, it } from "vitest";

import type { Party } from "@/modules/parties";

import { type PartyRow, toRow, visibleRows } from "./directory-model";

const row = (overrides: Partial<PartyRow> & Pick<PartyRow, "id" | "legalName">): PartyRow => ({
  kind: "company",
  taxId: "B00000000",
  addressLines: ["Calle Mayor 1"],
  countryCode: "ES",
  email: "x@example.com",
  roles: ["client"],
  ...overrides,
});

const levante = row({ id: "a", legalName: "Servicios Levante S.L.", taxId: "B00000201" });
const winery = row({
  id: "b",
  legalName: "Bodegas Sierra Alta S.L.",
  tradeName: "Sierra Álta",
  taxId: "B00000205",
  roles: ["supplier"],
});
const both = row({ id: "c", legalName: "Mediterránea S.A.", taxId: "A00000202", roles: ["client", "supplier"] });
const rows = [levante, winery, both];
const ids = (list: readonly PartyRow[]) => list.map((party) => party.id);

describe("visibleRows", () => {
  it("keeps everything, in order, for all roles and an empty query", () => {
    expect(ids(visibleRows(rows, { query: "  ", role: "all" }))).toEqual(["a", "b", "c"]);
  });

  it("filters by role, and a party with both roles shows under both", () => {
    expect(ids(visibleRows(rows, { query: "", role: "client" }))).toEqual(["a", "c"]);
    expect(ids(visibleRows(rows, { query: "", role: "supplier" }))).toEqual(["b", "c"]);
  });

  it("searches the legal name without case or accents", () => {
    expect(ids(visibleRows(rows, { query: "MEDITERRANEA", role: "all" }))).toEqual(["c"]);
  });

  it("searches the trade name and the tax ID", () => {
    expect(ids(visibleRows(rows, { query: "sierra alta", role: "all" }))).toEqual(["b"]);
    expect(ids(visibleRows(rows, { query: "b00000201", role: "all" }))).toEqual(["a"]);
  });

  it("combines the role and the search, and does not match other fields", () => {
    expect(ids(visibleRows(rows, { query: "s.l.", role: "supplier" }))).toEqual(["b"]);
    expect(visibleRows(rows, { query: "example.com", role: "all" })).toEqual([]);
  });

  it("does not change its input", () => {
    const input = [...rows];
    visibleRows(input, { query: "x", role: "client" });
    expect(input).toEqual(rows);
  });
});

describe("toRow", () => {
  it("drops the extensions", () => {
    const party: Party = { ...levante, ext: { vip: true } };

    expect(toRow(party)).not.toHaveProperty("ext");
    expect(toRow(party)).toMatchObject({ id: "a", legalName: levante.legalName });
  });
});
