import { describe, expect, it } from "vitest";

import { CATALOG } from "@/config/catalog";
import { VERTICALS } from "@/config/vertical";
import { DEFAULT_ROLES, permissionsOf } from "@/core/access";

import { abilitiesOf, NO_ABILITIES } from "./abilities";

const abilitiesOfRole = (index: 0 | 1 | 2) =>
  abilitiesOf(permissionsOf(DEFAULT_ROLES[index], CATALOG, VERTICALS.hospitality.modules));

describe("abilitiesOf", () => {
  it("gives nothing to an actor without permissions", () => {
    expect(abilitiesOf([])).toEqual(NO_ABILITIES);
  });

  it("gives the owner every action", () => {
    expect(abilitiesOfRole(0)).toEqual({ seat: true, advance: true, cancel: true, noShow: true });
  });

  it("gives a manager every action", () => {
    expect(abilitiesOfRole(1)).toEqual({ seat: true, advance: true, cancel: true, noShow: true });
  });

  it("lets staff seat and advance but neither cancel nor mark a no-show", () => {
    expect(abilitiesOfRole(2)).toEqual({ seat: true, advance: true, cancel: false, noShow: false });
  });
});
