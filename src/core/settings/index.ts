import { z } from "zod";

import { defineCapability, type Permission } from "@/core/capability";
import { ErrorCodes } from "@/core/errors";
import { err, ok, type Result } from "@/core/result";

/** The error code for a key no module declares. */
export const UNKNOWN_SETTING = "settings.unknown_key";

/** The error code for a setting that another capability changes, so `settings.values.update` must not. */
export const SETTING_NOT_WRITABLE = "settings.not_writable";

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
  /**
   * The capability that changes it when `settings.values.update` must not, because the setting guards the writes
   * themselves (the approval policy is `approvals.policy.set`, which no assistant can call).
   */
  readonly writtenBy?: string;
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
  /**
   * The same settings with a demo session's own values over them. A saved value that no longer parses against its
   * setting, or whose key is gone, is ignored, so a deploy that changes a schema never breaks a visitor's session.
   */
  over(sessionValues: Readonly<Record<string, unknown>> | undefined): SettingsReader;
  /**
   * The values a write may set, as their schemas parse them: every key registered, none owned by another capability
   * (`settings.not_writable`), each setting's own permission held, each value valid (`schema.invalid_input`, with
   * the paths under `values`).
   */
  accept(values: Readonly<Record<string, unknown>>, permissions: readonly string[]): Result<Record<string, unknown>>;
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
  return readerOf(registry, effective);
}

const definitionOf = (registry: SettingsRegistry, key: string): AnySetting | undefined =>
  Object.hasOwn(registry, key) ? registry[key] : undefined;

function readerOf(registry: SettingsRegistry, effective: ReadonlyMap<string, unknown>): SettingsReader {
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
    over: (sessionValues) => {
      if (sessionValues === undefined) return readerOf(registry, effective);
      const merged = new Map(effective);
      for (const [key, value] of Object.entries(sessionValues)) {
        const setting = definitionOf(registry, key);
        // A setting another capability owns never takes a session value from here, whatever the data holds.
        const parsed = setting?.writtenBy === undefined ? setting?.schema.safeParse(value) : undefined;
        if (parsed?.success) merged.set(key, parsed.data);
      }
      return readerOf(registry, merged);
    },
    accept: (values, permissions) => acceptValues(registry, values, permissions),
  };
}

function acceptValues(
  registry: SettingsRegistry,
  values: Readonly<Record<string, unknown>>,
  permissions: readonly string[],
): Result<Record<string, unknown>> {
  const keys = Object.keys(values);
  const unknown = keys.filter((key) => definitionOf(registry, key) === undefined);
  if (unknown.length > 0) {
    return err(UNKNOWN_SETTING, `No setting "${unknown.join('", "')}" is registered`, { keys: unknown });
  }
  const settings = keys.flatMap((key) => definitionOf(registry, key) ?? []);
  const owned = settings.find((setting) => setting.writtenBy !== undefined);
  if (owned?.writtenBy !== undefined) {
    return err(SETTING_NOT_WRITABLE, `${owned.key} is changed with ${owned.writtenBy}, not settings.values.update`, {
      key: owned.key,
      capability: owned.writtenBy,
    });
  }
  const denied = settings.find((setting) => !permissions.includes(setting.permission));
  if (denied !== undefined) {
    const blocked = settings.filter((setting) => setting.permission === denied.permission).map(({ key }) => key);
    return err(ErrorCodes.forbidden, `Changing ${blocked.join(", ")} needs ${denied.permission}`, {
      keys: blocked,
      permission: denied.permission,
    });
  }
  const parsed = settings.map((setting) => [setting.key, setting.schema.safeParse(values[setting.key])] as const);
  const paths = parsed.flatMap(([key, result]) =>
    result.success ? [] : result.error.issues.map((issue) => ["values", key, ...issue.path].join(".")),
  );
  if (paths.length > 0) return err(ErrorCodes.invalidInput, "settings.values.update rejected its values", { paths });
  return ok(Object.fromEntries(parsed.map(([key, result]) => [key, result.data])));
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * The setting values a visitor chose, which their demo session keeps in its data (`data.settings`), so a held write
 * is rehearsed, approved and saved like any other (ADR 0006, amendment 008). Undefined before the first change.
 */
export const sessionSettingsOf = (data: unknown): Readonly<Record<string, unknown>> | undefined =>
  isRecord(data) && isRecord(data.settings) ? data.settings : undefined;

/** Keeps `values` in the session's data over the values it held; false when the data cannot hold them. */
export function keepSessionSettings(data: unknown, values: Readonly<Record<string, unknown>>): boolean {
  if (!isRecord(data)) return false;
  data.settings = { ...sessionSettingsOf(data), ...values };
  return true;
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

export const settingsValuesUpdate = defineCapability({
  id: "settings.values.update",
  summary:
    "Change business settings in this demo session: send each key with its whole new value (an object setting is replaced, not merged; read it first with settings.values.get). Each value must pass its setting's rules and the caller must hold the setting's permission. Owner only. The approval policy is not changed here. Fails with settings.unknown_key, settings.not_writable, schema.invalid_input or access.forbidden.",
  input: z.strictObject({
    values: z
      .record(z.string().min(1), z.unknown())
      .refine((values) => Object.keys(values).length > 0, "Send at least one setting"),
  }),
  output: z.strictObject({ values: z.record(z.string(), z.unknown()) }),
  permission: "manage:settings",
  elevated: true,
  effect: "write",
  riskTier: 2,
  change: "overwrite",
  idempotency: "target-state",
});

export const settingsCapabilities = {
  "settings.values.get": settingsValuesGet,
  "settings.values.update": settingsValuesUpdate,
} as const;
