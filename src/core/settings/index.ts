import { z } from "zod";

import { defineCapability, type Permission } from "@/core/capability";
import { err, ok, type Result } from "@/core/result";

/** The error code for a key no module declares. */
export const UNKNOWN_SETTING = "settings.unknown_key";

export interface SettingDefinition<Key extends string, S extends z.ZodType> {
  /** `<module>.<path>`, for example `bookings.slot_minutes`. */
  readonly key: Key;
  readonly schema: S;
  /** The value when a preset does not override it. It must parse against `schema`. */
  readonly defaultValue: z.output<S>;
  /** The settings screen section that will edit it, for example `"bookings"`. */
  readonly section: string;
  /** Who may change it (ADR 0006). Reading goes through `read:settings`. */
  readonly permission: Permission;
  /** Message key of the label, resolved like a nav label. */
  readonly labelKey: string;
  readonly descriptionKey: string;
}

export type AnySetting = SettingDefinition<string, z.ZodType>;

/** Identity helper: it keeps the literal key and the schema type that `SettingsReader.get` relies on. */
export const defineSetting = <const Key extends string, S extends z.ZodType>(
  setting: SettingDefinition<Key, S>,
): SettingDefinition<Key, S> => setting;

export type SettingsRegistry = Readonly<Record<string, AnySetting>>;

type RegistryOf<S extends readonly AnySetting[]> = { readonly [T in S[number] as T["key"]]: T };

/** Registers settings by key; a duplicate key fails loudly, like duplicate capability ids. */
export const mergeSettings = <const S extends readonly AnySetting[]>(...settings: S): RegistryOf<S> => {
  const merged: Record<string, AnySetting> = {};
  for (const setting of settings) {
    if (Object.hasOwn(merged, setting.key)) throw new Error(`Duplicate setting key "${setting.key}"`);
    merged[setting.key] = setting;
  }
  return merged as RegistryOf<S>;
};

export interface SettingsReader {
  /**
   * The effective value, typed by the definition the module declares (`settings.get(walkInStayMinutes)`), so a
   * handler needs no cast and no import of the registry. Throws `UnknownSettingError` for a definition the registry
   * does not hold.
   */
  get<S extends AnySetting>(setting: S): z.output<S["schema"]>;
  /** Effective values of `keys`, or of every setting; an unknown key is the domain error `settings.unknown_key`. */
  values(keys?: readonly string[]): Result<Record<string, unknown>>;
}

export class UnknownSettingError extends Error {
  readonly code = UNKNOWN_SETTING;
  constructor(key: string) {
    super(`No setting "${key}" is registered`);
  }
}

/**
 * Reads settings with a preset's overrides over the registry defaults. Overrides are validated once, so a
 * malformed or unknown override fails when the reader is built, not when a screen reads it.
 */
export function createSettingsReader(
  registry: SettingsRegistry,
  overrides: Readonly<Record<string, unknown>> = {},
): SettingsReader {
  const effective = new Map<string, unknown>();
  for (const [key, setting] of Object.entries(registry)) {
    effective.set(key, Object.hasOwn(overrides, key) ? setting.schema.parse(overrides[key]) : setting.defaultValue);
  }
  const unknown = Object.keys(overrides).filter((key) => !effective.has(key));
  if (unknown.length > 0) throw new UnknownSettingError(unknown.join(", "));

  return {
    get: ((setting: AnySetting) => {
      if (!effective.has(setting.key)) throw new UnknownSettingError(setting.key);
      return effective.get(setting.key);
    }) as SettingsReader["get"],
    values: (keys) => {
      const wanted = keys ?? [...effective.keys()];
      const missing = wanted.filter((key) => !effective.has(key));
      if (missing.length > 0) {
        return err(UNKNOWN_SETTING, `No setting "${missing.join('", "')}" is registered`, { keys: missing });
      }
      return ok(Object.fromEntries(wanted.map((key) => [key, effective.get(key)])));
    },
  };
}

export const settingsValuesGet = defineCapability({
  id: "settings.values.get",
  summary: "Read the business settings in effect: every setting, or only the given keys.",
  input: z.strictObject({ keys: z.array(z.string().min(1)).optional() }),
  output: z.strictObject({ values: z.record(z.string(), z.unknown()) }),
  permission: "read:settings",
  effect: "read",
  riskTier: 0,
});

export const settingsCapabilities = { "settings.values.get": settingsValuesGet } as const;
