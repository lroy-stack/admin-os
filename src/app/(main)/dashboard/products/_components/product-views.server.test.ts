import { describe, expect, it } from "vitest";

import { hospitality } from "@/verticals/hospitality";
import { salon } from "@/verticals/salon";
import { workshop } from "@/verticals/workshop";

import { readableViews, visibleViews } from "./product-views.server";

const KINDS = [{ id: "catalog.collection", module: "catalog", capability: "catalog.list" }];
const access = { kinds: KINDS, permissionOf: () => "read:catalog" };
const ids = (entries: readonly { id: string }[]) => entries.map((entry) => entry.id);

describe("visibleViews", () => {
  it("keeps the preset's order when the module is enabled and the permission is held", () => {
    const shown = visibleViews(hospitality.productViews, {
      ...access,
      modules: ["catalog"],
      permissions: ["read:catalog"],
    });

    expect(ids(shown)).toEqual(["menu", "shop"]);
  });

  it("hides every view when the module is not enabled", () => {
    expect(
      visibleViews(hospitality.productViews, { ...access, modules: ["bookings"], permissions: ["read:catalog"] }),
    ).toEqual([]);
  });

  it("hides every view when the actor lacks the capability's permission", () => {
    expect(
      visibleViews(hospitality.productViews, { ...access, modules: ["catalog"], permissions: ["read:bookings"] }),
    ).toEqual([]);
  });

  it("hides a view of a kind no module declares", () => {
    expect(
      visibleViews(hospitality.productViews, {
        ...access,
        kinds: [],
        modules: ["catalog"],
        permissions: ["read:catalog"],
      }),
    ).toEqual([]);
  });

  it("hides a view whose capability has no permission defined", () => {
    expect(
      visibleViews(hospitality.productViews, {
        ...access,
        permissionOf: () => undefined,
        modules: ["catalog"],
        permissions: ["read:catalog"],
      }),
    ).toEqual([]);
  });
});

describe("readableViews, with the installed modules and the kit's catalogue", () => {
  it("shows the menu and the shop of a hospitality actor who reads the catalog", () => {
    expect(ids(readableViews(hospitality.productViews, hospitality.modules, ["read:catalog"]))).toEqual([
      "menu",
      "shop",
    ]);
  });

  it("shows a single view for the salon and for the workshop", () => {
    expect(ids(readableViews(salon.productViews, salon.modules, ["read:catalog"]))).toEqual(["shop"]);
    expect(ids(readableViews(workshop.productViews, workshop.modules, ["read:catalog"]))).toEqual(["parts"]);
  });

  it("shows nothing to an actor who cannot read the catalog", () => {
    expect(readableViews(hospitality.productViews, hospitality.modules, ["read:bookings"])).toEqual([]);
  });
});
