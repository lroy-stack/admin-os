import { describe, expect, it } from "vitest";

import type { StaffMember } from "@/modules/staff";

import { type TeamCard, toCard, visibleCards } from "./team-model";

const member: StaffMember = {
  id: "staff-marta",
  name: "Marta",
  roleIds: ["manager"],
  status: "active",
  locationIds: ["venue"],
  skills: ["alpha", "beta"],
  contract: { type: "full_time", startDate: "2022-03-01", hoursPerWeek: 40 },
  ext: { crew: "floor" },
};

const roleName = (id: string) => (id === "manager" ? "Manager" : id);

const cards: TeamCard[] = [
  toCard(member, roleName),
  toCard({ ...member, id: "staff-iker", name: "Iker", roleIds: ["staff"], skills: ["gamma"] }, roleName),
];

describe("toCard", () => {
  it("keeps the name, the role names, the skills and the status", () => {
    expect(toCard(member, roleName)).toEqual({
      id: "staff-marta",
      name: "Marta",
      roles: ["Manager"],
      skills: ["alpha", "beta"],
      active: true,
    });
  });

  it("never carries the contract, the extensions or the locations", () => {
    const card = toCard(member, roleName);
    expect(Object.keys(card).sort()).toEqual(["active", "id", "name", "roles", "skills"]);
    expect(JSON.stringify(card)).not.toMatch(/full_time|crew|venue|2022-03-01/);
  });

  it("marks an inactive member", () => {
    expect(toCard({ ...member, status: "inactive" }, roleName).active).toBe(false);
  });
});

describe("skill labels", () => {
  const labels: Record<string, string> = { alpha: "Primero" };
  const skillName = (skill: string) => labels[skill] ?? skill;

  it("shows a skill with a word as that word, and one without as typed", () => {
    expect(toCard(member, roleName, skillName).skills).toEqual(["Primero", "beta"]);
  });

  it("searches the label that is shown", () => {
    const shown = [toCard(member, roleName, skillName)];
    expect(visibleCards(shown, "primer")).toHaveLength(1);
    expect(visibleCards(shown, "alpha")).toHaveLength(0);
  });
});

describe("duplicate skills", () => {
  it("lists a skill once, whether it repeats as an id or as a label", () => {
    const labels: Record<string, string> = { alpha: "Same", beta: "Same" };
    const card = toCard({ ...member, skills: ["alpha", "alpha", "beta", "gamma"] }, roleName, (id) => labels[id] ?? id);
    expect(card.skills).toEqual(["Same", "gamma"]);
  });
});

describe("visibleCards", () => {
  it.each([
    { query: "", names: ["Marta", "Iker"] },
    { query: "  ", names: ["Marta", "Iker"] },
    { query: "mar", names: ["Marta"] },
    { query: "IKER", names: ["Iker"] },
    { query: "beta", names: ["Marta"] },
    { query: "manager", names: ["Marta"] },
    { query: "zzz", names: [] },
  ])("finds $names for “$query”", ({ query, names }) => {
    expect(visibleCards(cards, query).map((card) => card.name)).toEqual(names);
  });

  it("does not change its input", () => {
    const before = cards.map((card) => card.id);
    visibleCards(cards, "iker");
    expect(cards.map((card) => card.id)).toEqual(before);
  });
});
