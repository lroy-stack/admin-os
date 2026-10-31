import { describe, expect, it, vi } from "vitest";

import { THEME_PRESET_OPTIONS } from "@/ds/preferences";

import { auditTheme, declarationsOf, parseColor, parseRules, presetIds, tableStateSeparation } from "./theme-audit";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// The registry pulls next/font, which only runs inside a Next build; the preset default does not depend on fonts.
vi.mock("@/lib/fonts/registry", () => ({ fontKeys: ["outfit"] }));

const stylesDir = __dirname;
const presetDir = join(stylesDir, "presets");
const presetFiles = readdirSync(presetDir).filter((file) => file.endsWith(".css"));
const tokensCss = readFileSync(join(stylesDir, "tokens.css"), "utf8");
const rules = parseRules(
  [tokensCss, ...presetFiles.map((file) => readFileSync(join(presetDir, file), "utf8"))].join("\n"),
);
const themes = presetIds(rules);

const LIGHT_PRIMITIVES = [
  "--tint-hue",
  "--brand",
  "--brand-foreground",
  "--salmon",
  "--azure",
  "--table-arriving",
  "--table-seated",
  "--table-leaving",
  "--table-late",
  "--app-backdrop",
  "--app-backdrop-overlay",
];
const DARK_PRIMITIVES = [
  "--brand",
  "--brand-foreground",
  "--salmon",
  "--azure",
  "--app-backdrop",
  "--app-backdrop-overlay",
];

describe("liquid-glass theme presets", () => {
  it("ships exactly the five themes, registered by generate:presets", () => {
    expect([...themes].sort()).toEqual(["cobalt", "ember", "lime", "rose", "tide"]);
    expect(THEME_PRESET_OPTIONS.map((preset) => preset.value).sort()).toEqual([...themes].sort());
  });

  it("defaults to the lime reference theme", async () => {
    const { PREFERENCE_REGISTRY } = await import("@/ds/preferences");
    expect(PREFERENCE_REGISTRY.theme_preset.defaultValue).toBe("lime");
  });

  it.each(themes)("%s defines its primitives for light and dark", (theme) => {
    const light = declarationsOf(rules, `:root[data-theme-preset="${theme}"]`);
    const dark = declarationsOf(rules, `.dark:root[data-theme-preset="${theme}"]`);
    expect(LIGHT_PRIMITIVES.filter((name) => !(name in light))).toEqual([]);
    expect(DARK_PRIMITIVES.filter((name) => !(name in dark))).toEqual([]);
  });

  const reducedTransparency =
    tokensCss.match(/@media \(prefers-reduced-transparency: reduce\) \{([\s\S]*?)\n\}/)?.[1] ?? "";

  it.each([
    "--card: var(--surface-solid);",
    "--popover: var(--surface-solid);",
    "--glass-fill: var(--surface-solid);",
    "--glass-fill-solid: var(--surface-solid);",
    "--card-backdrop: none;",
    "--app-backdrop: none;",
  ])("turns opaque under reduced transparency: %s", (declaration) => {
    expect(reducedTransparency).toContain(declaration);
  });

  const rows = themes.flatMap((theme) => [...auditTheme(rules, theme, "light"), ...auditTheme(rules, theme, "dark")]);

  it.each(rows.map((row) => [`${row.theme} ${row.mode}: ${row.pair}`, row] as const))(
    "%s meets WCAG AA on the composited glass",
    (_label, row) => {
      expect(row.ratio).toBeGreaterThanOrEqual(row.minimum);
    },
  );

  it.each(themes)("%s keeps the four coloured table states apart", (theme) => {
    expect(tableStateSeparation(rules, theme)).toBeGreaterThanOrEqual(0.1);
  });
});

describe("colour maths", () => {
  it("converts OKLCH to sRGB", () => {
    const white = parseColor("oklch(1 0 0)");
    expect(white.r).toBeCloseTo(1, 3);
    expect(white.g).toBeCloseTo(1, 3);
    expect(white.b).toBeCloseTo(1, 3);
    // CSS Color 4 reference: oklch(0.628 0.2577 29.23) is sRGB red.
    const red = parseColor("oklch(0.628 0.2577 29.23)");
    expect(red.r).toBeCloseTo(1, 2);
    expect(red.g).toBeCloseTo(0, 2);
    expect(red.b).toBeCloseTo(0, 2);
  });

  it("mixes with transparent as an alpha change, as CSS premultiplies", () => {
    const mixed = parseColor("color-mix(in oklab, oklch(0.5 0 0) 72%, transparent)");
    const grey = parseColor("oklch(0.5 0 0)");
    expect(mixed.a).toBeCloseTo(0.72, 5);
    expect(mixed.r).toBeCloseTo(grey.r, 5);
  });
});
