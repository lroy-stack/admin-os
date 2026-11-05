import type { StaffRecord } from "@/modules/staff";

/**
 * What a card of the directory shows of a member: the name, the role names in the preset's words, the skills and
 * whether they are active. The list's DTO already leaves out the contract and `ext` (ADR 0020 §4).
 */
export interface TeamCard {
  readonly id: string;
  readonly name: string;
  readonly roles: readonly string[];
  readonly skills: readonly string[];
  readonly active: boolean;
}

/**
 * `roleName` turns a role id into the preset's word for it, and `skillName` a skill into its label; one they do not
 * know is shown as it is. Search matches what the card shows, so it matches these words.
 */
export function toCard(
  member: StaffRecord,
  roleName: (roleId: string) => string,
  skillName: (skill: string) => string = (skill) => skill,
): TeamCard {
  return {
    id: member.id,
    name: member.name,
    roles: member.roleIds.map(roleName),
    skills: [...new Set([...new Set(member.skills)].map(skillName))],
    active: member.status === "active",
  };
}

/** The cards whose name, role or skill contains the query, in the order given. Does not change its input. */
export function visibleCards(cards: readonly TeamCard[], query: string): TeamCard[] {
  const needle = query.trim().toLowerCase();
  if (needle === "") return [...cards];
  return cards.filter((card) => [card.name, ...card.roles, ...card.skills].join("\n").toLowerCase().includes(needle));
}
