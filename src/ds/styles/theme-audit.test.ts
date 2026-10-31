import { describe, expect, it, vi } from "vitest";

import { THEME_PRESET_OPTIONS } from "@/ds/preferences";

import {
  auditTheme,
  declarationsOf,
  parseColor,
  parseRules,
  presetIds,
  roomTones,
  tableStateSeparation,
  themeTokens,
  tokenColor,
  tokenNumber,
  toOklch,
} from "./theme-audit";
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
  "--table-seated",
  "--app-backdrop",
  "--app-backdrop-overlay",
];
const DARK_PRIMITIVES = [
  "--brand",
  "--brand-foreground",
  "--salmon",
  "--azure",
  "--table-seated",
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

  it("blurs menus and popovers as thick glass, and drops the blur when transparency is reduced", () => {
    expect(declarationsOf(rules, ":root")["--popover-backdrop"]).toBe("blur(var(--glass-blur-solid)) saturate(160%)");
    expect(reducedTransparency).toContain("--popover-backdrop: none;");
  });

  it("keeps the alert role out of the categorical chart palette", () => {
    const chart = [1, 2, 3, 4, 5].map((index) => declarationsOf(rules, ":root")[`--chart-${index}`]);
    expect(chart[0]).toBe("var(--brand)");
    expect(chart.join(" ")).not.toContain("--salmon");
  });

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

  it.each(
    rows.map(
      (row) =>
        [
          `${row.theme} ${row.mode}: ${row.pair} (WCAG 2.2 SC ${row.minimum === 4.5 ? "1.4.3" : "1.4.11"})`,
          row,
        ] as const,
    ),
  )("%s meets AA on the composited surface", (_label, row) => {
    expect(row.ratio).toBeGreaterThanOrEqual(row.minimum);
  });

  const themeModes = themes.flatMap((theme) => [[theme, "light"] as const, [theme, "dark"] as const]);

  it.each(themeModes)("%s %s keeps the four coloured table states apart", (theme, mode) => {
    expect(tableStateSeparation(rules, theme, mode)).toBeGreaterThanOrEqual(0.1);
  });
});

describe("dark room", () => {
  const ladder = themes.map((theme) => [theme, roomTones(rules, theme, "dark")] as const);
  const states = ["arriving", "seated", "leaving", "late"] as const;
  const stateCases = themes.flatMap((theme) => states.map((state) => [theme, state] as const));

  it.each(ladder)("%s steps up from paper to floor, landmarks, chairs and wall tops", (_theme, tones) => {
    expect(tones["--room-paper"]?.l).toBeCloseTo(0.25, 2);
    expect(tones["--room-floor"]?.l).toBeCloseTo(0.3, 2);
    expect(tones["--room-landmark"]?.l).toBeCloseTo(0.37, 2);
    expect(tones["--room-chair"]?.l).toBeCloseTo(0.42, 2);
    expect(tones["--room-wall"]?.l).toBeCloseTo(0.42, 2);
    expect(tones["--room-paper"]?.l).toBeLessThan(tones["--room-floor"]?.l ?? 0);
    expect(tones["--room-floor"]?.l).toBeLessThan(tones["--room-landmark"]?.l ?? 0);
    expect(tones["--room-landmark"]?.l).toBeLessThan(tones["--room-chair"]?.l ?? 0);
  });

  it.each(ladder)(
    "%s: Material dark theme, the room paper sits in the elevated-surface band (L 0.23-0.31, #1E1E1E at 1dp to #2E2E2E at 8dp)",
    (_theme, tones) => {
      expect(tones["--room-paper"]?.l).toBeGreaterThanOrEqual(0.23);
      expect(tones["--room-paper"]?.l).toBeLessThanOrEqual(0.31);
    },
  );

  it.each(themes)("%s: Material dark theme, the room is a raised surface above the dark page background", (theme) => {
    const tokens = themeTokens(rules, theme, "dark");
    const page = toOklch(tokenColor(tokens, "--background")).l;
    expect(roomTones(rules, theme, "dark")["--room-paper"].l).toBeGreaterThan(page);
  });

  it.each(ladder)(
    "%s: Material dark theme, the floor is raised above the paper and stays distinct",
    (_theme, tones) => {
      expect((tones["--room-floor"]?.l ?? 0) - (tones["--room-paper"]?.l ?? 0)).toBeGreaterThanOrEqual(0.04);
    },
  );

  it.each(ladder)(
    "%s: Material dark theme, ink on the dark room is off-white (high emphasis, about 87 % white), never #fff",
    (_theme, tones) => {
      expect(declarationsOf(rules, ".dark")["--room-ink"]).not.toMatch(/^oklch\(1 0 0\)$/);
      expect(tones["--room-ink"]?.l).toBeGreaterThanOrEqual(0.88);
      expect(tones["--room-ink"]?.l).toBeLessThanOrEqual(0.95);
    },
  );

  it.each(ladder)("%s gives the outdoor floor a touch of green", (_theme, tones) => {
    expect(tones["--room-floor-outdoor"]?.h).toBeGreaterThan(130);
    expect(tones["--room-floor-outdoor"]?.h).toBeLessThan(170);
    expect(tones["--room-floor-outdoor"]?.c).toBeGreaterThan(tones["--room-floor"]?.c ?? 0);
  });

  it.each(ladder)("%s keeps chairs neutral", (theme, tones) => {
    expect(tones["--room-chair"]?.c).toBeLessThanOrEqual(0.02);
    expect(tokenNumber(rules, theme, "dark", "--room-chair-tint")).toBeLessThanOrEqual(0.25);
  });

  it.each(ladder)("%s shows free tables as a light neutral surface", (_theme, tones) => {
    expect(tones["--table-free"]?.l).toBeGreaterThanOrEqual(0.5);
    expect(tones["--table-free"]?.l).toBeLessThanOrEqual(0.64);
    expect(tones["--table-free"]?.c).toBeLessThanOrEqual(0.02);
  });

  it.each(stateCases)("%s table-%s sits at mid lightness", (theme, state) => {
    const tone = roomTones(rules, theme, "dark")[`--table-${state}`];
    expect(tone?.l).toBeGreaterThanOrEqual(0.62);
    expect(tone?.l).toBeLessThanOrEqual(0.72);
  });

  it.each(stateCases)("%s table-%s keeps 0.5-0.7x of its light-mode chroma", (theme, state) => {
    const dark = roomTones(rules, theme, "dark")[`--table-${state}`]?.c ?? 0;
    const light = roomTones(rules, theme, "light")[`--table-${state}`]?.c ?? 1;
    expect(dark / light).toBeGreaterThanOrEqual(0.5);
    expect(dark / light).toBeLessThanOrEqual(0.7);
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
