import { describe, expect, it } from "vitest";

import { businessProfile } from "@/core/business";
import { createSettingsReader } from "@/core/settings";

import { SETTINGS } from "./settings";
import { VERTICALS, type VerticalId } from "./vertical";

const settings = Object.entries(SETTINGS);
const presets = (Object.keys(VERTICALS) as VerticalId[]).map((id) => [id, VERTICALS[id]] as const);
const overrides = presets.flatMap(([id, preset]) =>
  Object.entries(preset.settingsDefaults).map(([key, value]) => [id, key, value] as const),
);

describe("the settings registry", () => {
  it.each(settings)("%s has a default that parses against its schema", (_key, setting) => {
    expect(setting.schema.safeParse(setting.defaultValue).success).toBe(true);
  });

  it.each(settings)("%s is registered under its own key", (key, setting) => {
    expect(setting.key).toBe(key);
  });
});

describe("preset settings overrides", () => {
  it.each(presets)("%s builds a reader from its overrides", (_id, preset) => {
    expect(() => createSettingsReader(SETTINGS, preset.settingsDefaults)).not.toThrow();
  });

  it.each(overrides)("%s overrides %s with a value its schema accepts", (_id, key, value) => {
    expect(SETTINGS[key as keyof typeof SETTINGS].schema.safeParse(value).success).toBe(true);
  });

  it("gives every preset a demo company of its own", () => {
    const names = presets.map(([, preset]) =>
      createSettingsReader(SETTINGS, preset.settingsDefaults).get(businessProfile),
    );
    expect(new Set(names.map(({ tradeName }) => tradeName)).size).toBe(presets.length);
  });

  it("names a demo company in every preset", () => {
    const names = presets.map(([, preset]) =>
      createSettingsReader(SETTINGS, preset.settingsDefaults).get(businessProfile),
    );
    expect(names.filter(({ tradeName }) => tradeName === "")).toEqual([]);
  });
});
