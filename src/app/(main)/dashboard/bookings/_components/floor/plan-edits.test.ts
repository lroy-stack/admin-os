import { describe, expect, it } from "vitest";

import { type FloorPlan, findTable, locateTables } from "./floor-model";
import { applyEdit, findPlanIssues, nextTableLabel, snapCm } from "./plan-edits";
import { mockVenue } from "./venue";

// New tables get opaque ids, so tests find them by the label people see.
const tableLabelled = (plan: FloorPlan, label: string) =>
  locateTables(plan).find(({ table }) => table.label === label)?.table;

describe("applyEdit", () => {
  it("moves a table onto the 10 cm grid without touching the original plan", () => {
    const moved = applyEdit(mockVenue, { type: "moveTable", tableId: "S1", xCm: 233, yCm: 187 });
    expect(findTable(moved, "S1")?.table).toMatchObject({ xCm: 230, yCm: 190 });
    expect(findTable(mockVenue, "S1")?.table).toMatchObject({ xCm: 200, yCm: 170 });
  });

  it("adds a table sized from its covers with the zone's next label", () => {
    const plan = applyEdit(mockVenue, { type: "addTable", zoneId: "dining", shape: "rect", capacity: 6 });
    expect(tableLabelled(plan, "S9")).toMatchObject({ widthCm: 180, depthCm: 90, capacity: 6 });
  });

  it("duplicates and removes tables", () => {
    const duplicated = applyEdit(mockVenue, { type: "duplicateTable", tableId: "T3" });
    const copy = tableLabelled(duplicated, "T9");
    expect(copy?.capacity).toBe(4);
    const removed = applyEdit(duplicated, { type: "removeTable", tableId: copy?.id ?? "" });
    expect(tableLabelled(removed, "T9")).toBeUndefined();
  });

  it("keeps table ids unique when a renamed table frees its label", () => {
    const renamed = applyEdit(mockVenue, { type: "updateTable", tableId: "S2", change: { label: "VIP" } });
    const added = applyEdit(renamed, { type: "addTable", zoneId: "dining", shape: "round", capacity: 2 });
    const ids = locateTables(added).map(({ table }) => table.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(tableLabelled(added, "S2")?.id).not.toBe("S2");
  });

  it("rotates tables and landmarks by a step", () => {
    const turned = applyEdit(mockVenue, { type: "rotateElement", kind: "table", id: "S6", byDeg: 15 });
    expect(findTable(turned, "S6")?.table.rotationDeg).toBe(15);
    const bar = applyEdit(mockVenue, { type: "rotateElement", kind: "landmark", id: "bar-counter", byDeg: -15 });
    expect(bar.levels[0]?.landmarks.find((landmark) => landmark.id === "bar-counter")?.rotationDeg).toBe(-15);
  });

  it("adds a level and only removes it while empty", () => {
    const withLevel = applyEdit(mockVenue, { type: "addLevel", name: "Level 3" });
    expect(withLevel.levels).toHaveLength(3);
    const added = withLevel.levels.at(-1);
    expect(applyEdit(withLevel, { type: "removeLevel", levelId: added?.id ?? "" }).levels).toHaveLength(2);
    expect(applyEdit(mockVenue, { type: "removeLevel", levelId: "street" }).levels).toHaveLength(2);
  });

  it("adds a zone beside the existing ones and a landmark inside the level", () => {
    const withZone = applyEdit(mockVenue, { type: "addZone", levelId: "rooftop", name: "Zone 2" });
    expect(withZone.levels[1]?.zones.at(-1)).toMatchObject({ name: "Zone 2", outline: { xCm: 1100 } });
    const withPlant = applyEdit(mockVenue, { type: "addLandmark", levelId: "rooftop", kind: "plant", label: "" });
    expect(withPlant.levels[1]?.landmarks.at(-1)?.kind).toBe("plant");
  });
});

describe("helpers", () => {
  it("snaps to the editor grid and finds the next free label", () => {
    expect(snapCm(234)).toBe(230);
    expect(snapCm(235)).toBe(240);
    expect(nextTableLabel(mockVenue, "B")).toBe("B5");
  });
});

describe("findPlanIssues", () => {
  it("reports nothing for the mock venue", () => {
    expect(findPlanIssues(mockVenue)).toEqual([]);
  });

  it("reports overlapping tables and tables outside their zone", () => {
    const stacked = applyEdit(mockVenue, { type: "moveTable", tableId: "S2", xCm: 210, yCm: 170 });
    const outside = applyEdit(stacked, { type: "moveTable", tableId: "T1", xCm: 1500, yCm: 150 });
    expect(findPlanIssues(outside)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "overlap", tableLabel: "S1", otherLabel: "S2" }),
        expect.objectContaining({
          kind: "outside",
          tableLabel: "T1",
          zone: expect.objectContaining({ id: "terrace" }),
        }),
      ]),
    );
  });

  it("keeps table count stable through edits", () => {
    const edited = applyEdit(mockVenue, { type: "updateTable", tableId: "S5", change: { capacity: 6 } });
    expect(locateTables(edited)).toHaveLength(locateTables(mockVenue).length);
  });
});
