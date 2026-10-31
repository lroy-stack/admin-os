import { describe, expect, it } from "vitest";

import type { TableShape } from "./floor-model";
import { defaultSize, seatPlacements } from "./table-geometry";

describe("defaultSize", () => {
  it("sizes tables from covers with the shared rules", () => {
    expect(defaultSize(4, "rect")).toEqual({ widthCm: 120, depthCm: 90 });
    expect(defaultSize(6, "rect")).toEqual({ widthCm: 180, depthCm: 90 });
    expect(defaultSize(2, "square")).toEqual({ widthCm: 70, depthCm: 70 });
    expect(defaultSize(4, "round")).toEqual({ widthCm: 100, depthCm: 100 });
    expect(defaultSize(2, "round")).toEqual({ widthCm: 70, depthCm: 70 });
  });
});

const shapes: TableShape[] = ["rect", "square", "round", "bar"];
const seatingCases = shapes.flatMap((shape) => [1, 2, 3, 4, 6, 8].map((capacity) => [shape, capacity] as const));

describe("seatPlacements", () => {
  it.each(seatingCases)("places one chair per cover on a %s table for %i", (shape, capacity) => {
    expect(seatPlacements({ shape, capacity, ...defaultSize(capacity, shape) })).toHaveLength(capacity);
  });

  it("keeps chairs outside the table top", () => {
    const placements = seatPlacements({ shape: "rect", capacity: 4, widthCm: 120, depthCm: 90 });
    expect(Math.min(...placements.map((placement) => Math.abs(placement.yCm)))).toBeGreaterThan(45);
  });
});
