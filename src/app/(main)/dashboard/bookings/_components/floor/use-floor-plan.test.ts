import { describe, expect, it } from "vitest";

import { applyEdit } from "./plan-edits";
import { floorPlanSchema } from "./use-floor-plan";
import { mockVenue } from "./venue";

describe("floorPlanSchema", () => {
  it("accepts the default room after levels, zones, tables and landmarks are added and changed", () => {
    const withLevel = applyEdit(mockVenue, { type: "addLevel", name: "Level 3" });
    const withZone = applyEdit(withLevel, { type: "addZone", levelId: "rooftop", name: "Zone 2" });
    const withTable = applyEdit(withZone, { type: "addTable", zoneId: "dining", shape: "round", capacity: 2 });
    const withCopy = applyEdit(withTable, { type: "duplicateTable", tableId: "S1" });
    const withPlant = applyEdit(withCopy, { type: "addLandmark", levelId: "street", kind: "plant", label: "" });
    const turned = applyEdit(withPlant, { type: "rotateElement", kind: "table", id: "S1", byDeg: 15 });
    expect(floorPlanSchema.safeParse(turned).success).toBe(true);
  });

  it("rejects a zone collapsed to no width, which is why the editor clamps zone sizes", () => {
    const dining = mockVenue.levels[0]?.zones[0];
    const collapsed = applyEdit(mockVenue, {
      type: "updateZone",
      zoneId: dining?.id ?? "",
      change: { outline: { xCm: 0, yCm: 0, widthCm: 0, depthCm: 500 } },
    });
    expect(floorPlanSchema.safeParse(collapsed).success).toBe(false);
  });
});
