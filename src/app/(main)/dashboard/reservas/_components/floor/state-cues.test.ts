import { describe, expect, it } from "vitest";

import { tableStateCues } from "./state-cues";
import type { VisibleTableState } from "./table-state";

const states = Object.keys(tableStateCues) as VisibleTableState[];
const occupied = states.filter((state) => state !== "free");

describe("table state cues (WCAG 2.2 SC 1.4.1 Use of Color)", () => {
  it.each(occupied)("%s has a plate glyph, so it does not rely on colour alone", (state) => {
    expect(tableStateCues[state].icon).not.toBeNull();
  });

  it("gives every state its own glyph, and leaves only free tables with a bare plate", () => {
    const icons = states.map((state) => tableStateCues[state].icon);
    expect(new Set(icons).size).toBe(states.length);
    expect(tableStateCues.free.icon).toBeNull();
  });

  it("patterns the two states that need attention: late and blocked", () => {
    expect(tableStateCues.late.pattern).toBe("stripes");
    expect(tableStateCues.blocked.pattern).toBe("dots");
  });
});
