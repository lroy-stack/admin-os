import { describe, expect, it } from "vitest";

import { fittingTables, type SlotOption, slotOptions } from "./new-reservation-slots";
import type { ServiceDay } from "./view-model";

const service: ServiceDay = {
  businessDay: "2026-10-31",
  isToday: true,
  nowMin: 1240,
  window: { startMin: 720, endMin: 1380 },
  lateAfterMin: 15,
  walkInStayMin: 90,
};

const slots = [
  { startMin: 1260, endMin: 1350, resourceIds: ["S8"] },
  { startMin: 1200, endMin: 1290, resourceIds: ["S3", "S8"] },
  { startMin: 1320, endMin: 1410, resourceIds: [] },
];

describe("slotOptions", () => {
  it("drops full slots and the ones already past on the clock's day", () => {
    expect(slotOptions(slots, "2026-10-31", service)).toEqual([{ startMin: 1260, endMin: 1350, tableIds: ["S8"] }]);
  });

  it("keeps earlier slots on another day, earliest first", () => {
    expect(slotOptions(slots, "2026-11-01", service).map((slot) => slot.startMin)).toEqual([1200, 1260]);
  });

  it("keeps earlier slots when the day on screen is not the clock's", () => {
    expect(slotOptions(slots, "2026-10-31", { ...service, isToday: false }).map((slot) => slot.startMin)).toEqual([
      1200, 1260,
    ]);
  });

  it("is empty when nothing fits", () => {
    expect(slotOptions([], "2026-11-01", service)).toEqual([]);
  });
});

describe("fittingTables", () => {
  const table = (id: string, capacity: number) => ({ table: { id, label: id, capacity, inService: true } });
  const plan = [table("S8", 6), table("S3", 2), table("B1", 4)];
  const slot: SlotOption = { startMin: 1200, endMin: 1290, tableIds: ["S8", "S3", "X9"] };

  it("keeps the tables the slot names and the plan draws, the closest fit first", () => {
    expect(fittingTables(slot, plan).map((location) => location.table.id)).toEqual(["S3", "S8"]);
  });

  it("offers nothing before a slot is picked", () => {
    expect(fittingTables(null, plan)).toEqual([]);
  });
});
