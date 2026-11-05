import { describe, expect, it } from "vitest";

import { LOCALES } from "@/core/i18n";
import { inventoryViewsMessages } from "@/modules/inventory/server";
import { hospitalitySeed } from "@/verticals/hospitality/server";
import { salonSeed } from "@/verticals/salon/server";
import { workshopSeed } from "@/verticals/workshop/server";

const codes = [
  ...new Set(
    [...hospitalitySeed.stockItems, ...salonSeed.stockItems, ...workshopSeed.stockItems].map((item) => item.unit),
  ),
];

describe("the unit labels of the stock view", () => {
  it("has a seed to check", () => {
    expect(codes.length).toBeGreaterThan(0);
  });

  it.each(LOCALES)("name every unit code the three seeds use in %s", (locale) => {
    expect(codes.filter((code) => !Object.hasOwn(inventoryViewsMessages[locale].stock.units, code))).toEqual([]);
  });
});
