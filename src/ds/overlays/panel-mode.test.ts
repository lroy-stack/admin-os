import { describe, expect, it } from "vitest";

import { panelMode } from "./panel-mode";
import type { Viewport } from "./use-viewport";

describe("panelMode", () => {
  it.each([
    ["phone", "sheet"],
    ["tablet", "sheet"],
    ["desktop", "column"],
  ] as const)("is %s -> %s", (viewport: Viewport, mode) => {
    expect(panelMode(viewport)).toBe(mode);
  });

  it("is unknown until the viewport is", () => {
    expect(panelMode(undefined)).toBeUndefined();
  });
});
