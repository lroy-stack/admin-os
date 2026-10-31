const THEME_MODE_OPTIONS = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
] as const;

export const THEME_MODE_VALUES = THEME_MODE_OPTIONS.map((o) => o.value);
export type ThemeMode = (typeof THEME_MODE_VALUES)[number];
export type ResolvedThemeMode = "light" | "dark";

// --- generated:themePresets:start ---

export const THEME_PRESET_OPTIONS = [
  {
    label: "Cobalt",
    value: "cobalt",
    brand: {
      light: "oklch(0.52 0.17 260)",
      dark: "oklch(0.75 0.14 258)",
    },
  },
  {
    label: "Ember",
    value: "ember",
    brand: {
      light: "oklch(0.55 0.16 45)",
      dark: "oklch(0.79 0.15 55)",
    },
  },
  {
    label: "Lime",
    value: "lime",
    brand: {
      light: "oklch(0.52 0.15 132)",
      dark: "oklch(0.915 0.165 120.51)",
    },
  },
  {
    label: "Rose",
    value: "rose",
    brand: {
      light: "oklch(0.54 0.17 355)",
      dark: "oklch(0.81 0.12 355)",
    },
  },
  {
    label: "Tide",
    value: "tide",
    brand: {
      light: "oklch(0.52 0.1 195)",
      dark: "oklch(0.83 0.11 190)",
    },
  },
] as const;

export const THEME_PRESET_VALUES = THEME_PRESET_OPTIONS.map((p) => p.value);

export type ThemePreset = (typeof THEME_PRESET_OPTIONS)[number]["value"];

// --- generated:themePresets:end ---
