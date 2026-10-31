import { describe, expect, it } from "vitest";

import {
  type Box,
  cameraBasis,
  easeOutCubic,
  FOCUS,
  fitScale,
  focusScale,
  lerpAngle,
  projectedSize,
  VIEW_PRESETS,
} from "./camera-math";

const room: Box = { minX: 0, maxX: 12, minZ: 0, maxZ: 8, height: 0 };

describe("cameraBasis", () => {
  it("looks straight down with north up in 2D", () => {
    const { toCamera, up, right } = cameraBasis(VIEW_PRESETS["2d"]);
    expect(toCamera.y).toBeCloseTo(1);
    expect(up.z).toBeCloseTo(-1);
    expect(right.x).toBeCloseTo(1);
  });
});

describe("projectedSize", () => {
  it("matches the plan size in 2D", () => {
    const size = projectedSize(room, VIEW_PRESETS["2d"]);
    expect(size.width).toBeCloseTo(12);
    expect(size.height).toBeCloseTo(8);
  });

  it("foreshortens depth by the sine of the pitch when tilted without yaw", () => {
    expect(projectedSize(room, { pitchDeg: 52, yawDeg: 0 }).height).toBeCloseTo(8 * Math.sin((52 * Math.PI) / 180));
  });
});

describe("fitScale and focusScale", () => {
  const viewport = { width: 1200, height: 800 };

  it("fits the room inside the viewport with a margin", () => {
    const scale = fitScale(room, VIEW_PRESETS["2d"], viewport, 0.6);
    expect(scale).toBeCloseTo(Math.min(1200 / 13.2, 800 / 9.2));
  });

  it("never zooms a focused table past the cap nor below the fit", () => {
    const fitted = fitScale(room, VIEW_PRESETS["2d"], viewport);
    const tiny: Box = { minX: 1, maxX: 1.2, minZ: 1, maxZ: 1.2, height: 0.75 };
    expect(focusScale(tiny, VIEW_PRESETS["2d"], viewport, fitted)).toBeCloseTo(fitted * FOCUS.maxFactor);
    expect(focusScale(room, VIEW_PRESETS["2d"], viewport, fitted)).toBeCloseTo(fitted);
  });
});

describe("motion helpers", () => {
  it("eases out and turns the short way round", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
    expect(lerpAngle(350, 10, 1)).toBeCloseTo(370);
    expect(lerpAngle(10, 350, 0.5)).toBeCloseTo(0);
  });
});
