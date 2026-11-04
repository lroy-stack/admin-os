import { describe, expect, it } from "vitest";
import { z } from "zod";

import { defineCapability, descriptorViolations } from "@/core/capability";
import { type Actor, createClient } from "@/core/client";
import type { BusinessClock } from "@/core/clock";
import { createMockAdapter, createSessionStore, kernelMockHandlers, mockHandler } from "@/core/mock";
import { ok } from "@/core/result";

import {
  createSettingsReader,
  defineSetting,
  mergeSettings,
  SETTING_NOT_WRITABLE,
  settingsCapabilities,
  settingsValuesGet,
  settingsValuesUpdate,
  UNKNOWN_SETTING,
} from "./index";

const stay = defineSetting({
  key: "demo.stay_minutes",
  schema: z.number().int().min(1),
  defaultValue: 90,
  section: "demo",
  permission: "update:settings",
  labelKey: "demo.settings.stay.label",
  descriptionKey: "demo.settings.stay.description",
});

const greeting = defineSetting({
  key: "demo.greeting",
  schema: z.string().min(1),
  defaultValue: "hello",
  section: "demo",
  permission: "update:settings",
  labelKey: "demo.settings.greeting.label",
  descriptionKey: "demo.settings.greeting.description",
});

/** A setting another capability owns, as the approval policy is owned by `approvals.policy.set`. */
const guarded = defineSetting({
  key: "demo.guarded",
  schema: z.enum(["on", "off"]),
  defaultValue: "on",
  section: "demo",
  permission: "update:settings",
  writtenBy: "demo.guarded.set",
  labelKey: "demo.settings.guarded.label",
  descriptionKey: "demo.settings.guarded.description",
});

const registry = mergeSettings(stay, greeting, guarded);
const editor = ["update:settings"];

describe("mergeSettings", () => {
  it("refuses two settings with the same key", () => {
    expect(() => mergeSettings(stay, stay)).toThrow(/Duplicate setting key "demo.stay_minutes"/);
  });
});

describe("createSettingsReader", () => {
  it("types a read by the definition: a number setting is a number, a string setting a string", () => {
    const reader = createSettingsReader(registry);
    const minutes: number = reader.get(stay);
    // @ts-expect-error a number setting is not a string
    const notAString: string = reader.get(stay);
    const text: string = reader.get(greeting);

    expect([minutes, notAString, text]).toEqual([90, 90, "hello"]);
  });

  it("refuses a definition the registry does not hold", () => {
    const stranger = defineSetting({ ...stay, key: "demo.stranger" });

    expect(() => createSettingsReader(registry).get(stranger)).toThrow(/demo.stranger/);
  });

  it("returns the default when the preset does not override", () => {
    expect(createSettingsReader(registry).get(stay)).toBe(90);
  });

  it("returns the preset override over the default", () => {
    expect(createSettingsReader(registry, { "demo.stay_minutes": 45 }).get(stay)).toBe(45);
  });

  it("rejects an override that does not parse against the setting's schema", () => {
    expect(() => createSettingsReader(registry, { "demo.stay_minutes": 0 })).toThrow();
  });

  it("rejects an override for a key no module declares", () => {
    expect(() => createSettingsReader(registry, { "demo.nope": 1 })).toThrow(/demo.nope/);
  });

  it("answers unknown_key for a key that is not registered", () => {
    expect(createSettingsReader(registry).values(["demo.nope"])).toMatchObject({
      ok: false,
      error: { code: UNKNOWN_SETTING, details: { keys: ["demo.nope"] } },
    });
  });

  it("lists every effective value when no keys are asked for", () => {
    expect(createSettingsReader(registry, { "demo.greeting": "hi" }).values()).toEqual(
      ok({ "demo.stay_minutes": 90, "demo.greeting": "hi", "demo.guarded": "on" }),
    );
  });

  it("lists only the asked keys", () => {
    expect(createSettingsReader(registry).values(["demo.greeting"])).toEqual(ok({ "demo.greeting": "hello" }));
  });
});

describe("a reader over a session's own values", () => {
  it("answers the session's value over the preset's and the default", () => {
    const reader = createSettingsReader(registry, { "demo.stay_minutes": 45 }).over({ "demo.stay_minutes": 30 });
    expect([reader.get(stay), reader.get(greeting)]).toEqual([30, "hello"]);
  });

  it("lists the session's values with the others", () => {
    expect(createSettingsReader(registry).over({ "demo.greeting": "hey" }).values(["demo.greeting"])).toEqual(
      ok({ "demo.greeting": "hey" }),
    );
  });

  it("ignores a saved value that no longer parses against its setting", () => {
    expect(createSettingsReader(registry).over({ "demo.stay_minutes": 0 }).get(stay)).toBe(90);
  });

  it("ignores a saved key that is no longer registered", () => {
    expect(createSettingsReader(registry).over({ "demo.gone": 1 }).values()).toEqual(
      createSettingsReader(registry).values(),
    );
  });

  it("never answers a session value for a setting another capability owns", () => {
    expect(createSettingsReader(registry).over({ "demo.guarded": "off" }).get(guarded)).toBe("on");
  });

  it("is the reader itself without session values", () => {
    expect(createSettingsReader(registry).over(undefined).get(stay)).toBe(90);
  });
});

describe("what a write may set", () => {
  it("accepts values that parse, as their schemas parse them", () => {
    expect(createSettingsReader(registry).accept({ "demo.greeting": "hi" }, editor)).toEqual(
      ok({ "demo.greeting": "hi" }),
    );
  });

  it("refuses a key no module declares", () => {
    expect(createSettingsReader(registry).accept({ "demo.nope": 1 }, editor)).toMatchObject({
      ok: false,
      error: { code: UNKNOWN_SETTING, details: { keys: ["demo.nope"] } },
    });
  });

  it("refuses a value its schema rejects, naming the key", () => {
    expect(createSettingsReader(registry).accept({ "demo.stay_minutes": 0 }, editor)).toMatchObject({
      ok: false,
      error: { code: "schema.invalid_input", details: { paths: ["values.demo.stay_minutes"] } },
    });
  });

  it("refuses a setting the actor lacks the permission for", () => {
    expect(createSettingsReader(registry).accept({ "demo.greeting": "hi" }, [])).toMatchObject({
      ok: false,
      error: { code: "access.forbidden", details: { keys: ["demo.greeting"], permission: "update:settings" } },
    });
  });

  it("refuses a setting that another capability changes, and names it", () => {
    expect(createSettingsReader(registry).accept({ "demo.guarded": "off" }, editor)).toMatchObject({
      ok: false,
      error: { code: SETTING_NOT_WRITABLE, details: { key: "demo.guarded", capability: "demo.guarded.set" } },
    });
  });
});

const clock: BusinessClock = {
  businessDay: "2026-10-31",
  today: "2026-10-31",
  nowMin: 600,
  cutoffMin: 0,
  timeZone: "Europe/Madrid",
};

const staffActor: Actor = {
  actorId: "demo-staff",
  roleId: "staff",
  permissions: ["read:settings", "read:demo"],
};

const demoStay = defineCapability({
  id: "demo.stay.get",
  summary: "Test-only capability that reads a setting through its handler context.",
  input: z.strictObject({}),
  output: z.number(),
  permission: "read:demo",
  effect: "read",
  riskTier: 0,
});

const catalog = { "demo.stay.get": demoStay, ...settingsCapabilities };

const clientFor = (overrides: Record<string, unknown>) =>
  createClient(
    catalog,
    createMockAdapter({
      handlers: kernelMockHandlers,
      store: createSessionStore({}),
      clock,
      settings: createSettingsReader(registry, overrides),
    }),
    { actor: staffActor, retryDelayMs: 0, logger: () => undefined, mode: "production" },
  );

describe("settings.values.get", () => {
  it("passes the descriptor rules", () => {
    expect(descriptorViolations(settingsValuesGet)).toEqual([]);
  });

  it("returns the effective values for a role that holds read:settings", async () => {
    expect(await clientFor({ "demo.stay_minutes": 45 }).call("settings.values.get", {})).toEqual(
      ok({ values: { "demo.stay_minutes": 45, "demo.greeting": "hello", "demo.guarded": "on" } }),
    );
  });

  it("answers settings.unknown_key for an unknown key", async () => {
    expect(await clientFor({}).call("settings.values.get", { keys: ["demo.nope"] })).toMatchObject({
      ok: false,
      error: { code: "settings.unknown_key" },
    });
  });

  it("is forbidden without read:settings", async () => {
    const client = createClient(
      catalog,
      createMockAdapter({ handlers: kernelMockHandlers, store: createSessionStore({}), clock }),
      {
        actor: { actorId: "x", roleId: "none", permissions: [] },
        retryDelayMs: 0,
        logger: () => undefined,
        mode: "production",
      },
    );
    expect(await client.call("settings.values.get", {})).toMatchObject({
      ok: false,
      error: { code: "access.forbidden" },
    });
  });
});

const ownerActor: Actor = {
  actorId: "demo-owner",
  roleId: "owner",
  permissions: ["read:settings", "manage:settings", "update:settings"],
};

describe("settings.values.update", () => {
  const store = createSessionStore({});
  const ownerIn = (sessionId?: string) =>
    createClient(
      catalog,
      createMockAdapter({
        handlers: kernelMockHandlers,
        store,
        clock,
        settings: createSettingsReader(registry, { "demo.stay_minutes": 45 }),
        ...(sessionId === undefined ? {} : { sessionId }),
      }),
      { actor: ownerActor, retryDelayMs: 0, logger: () => undefined, mode: "production" },
    );

  it("passes the descriptor rules", () => {
    expect(descriptorViolations(settingsValuesUpdate)).toEqual([]);
  });

  it("answers the values it set", async () => {
    expect(await ownerIn("s-answer").call("settings.values.update", { values: { "demo.stay_minutes": 30 } })).toEqual(
      ok({ values: { "demo.stay_minutes": 30 } }),
    );
  });

  it("sets a value that settings.values.get then returns in the same session", async () => {
    const client = ownerIn("s-same");
    await client.call("settings.values.update", { values: { "demo.stay_minutes": 30 } });
    expect(await client.call("settings.values.get", { keys: ["demo.stay_minutes"] })).toEqual(
      ok({ values: { "demo.stay_minutes": 30 } }),
    );
  });

  it("leaves another session on the preset's value", async () => {
    await ownerIn("s-one").call("settings.values.update", { values: { "demo.stay_minutes": 30 } });
    expect(await ownerIn("s-other").call("settings.values.get", { keys: ["demo.stay_minutes"] })).toEqual(
      ok({ values: { "demo.stay_minutes": 45 } }),
    );
  });

  it("keeps the values a session set earlier when it sets another", async () => {
    const client = ownerIn("s-keep");
    await client.call("settings.values.update", { values: { "demo.stay_minutes": 30 } });
    await client.call("settings.values.update", { values: { "demo.greeting": "hey" } });
    expect(await client.call("settings.values.get", { keys: ["demo.stay_minutes", "demo.greeting"] })).toEqual(
      ok({ values: { "demo.stay_minutes": 30, "demo.greeting": "hey" } }),
    );
  });

  it("lets a handler read the session's value through its context", async () => {
    const adapter = (sessionId: string) =>
      createMockAdapter({
        handlers: { ...kernelMockHandlers, ...mockHandler(demoStay, (_input, { settings }) => ok(settings.get(stay))) },
        store,
        clock,
        settings: createSettingsReader(registry),
        sessionId,
      });
    const options = { actor: { ...ownerActor, permissions: [...ownerActor.permissions, "read:demo"] } } as const;
    const client = createClient(catalog, adapter("s-handler"), { ...options, retryDelayMs: 0, mode: "production" });
    await client.call("settings.values.update", { values: { "demo.stay_minutes": 25 } });
    expect(await client.call("demo.stay.get", {})).toEqual(ok(25));
  });

  it("needs a demo session", async () => {
    expect(await ownerIn().call("settings.values.update", { values: { "demo.stay_minutes": 30 } })).toMatchObject({
      ok: false,
      error: { code: "transport.unavailable" },
    });
  });

  it("refuses an empty change", async () => {
    expect(await ownerIn("s-empty").call("settings.values.update", { values: {} })).toMatchObject({
      ok: false,
      error: { code: "schema.invalid_input" },
    });
  });

  it("is forbidden without manage:settings", async () => {
    const client = createClient(
      catalog,
      createMockAdapter({ handlers: kernelMockHandlers, store, clock, sessionId: "s-staff" }),
      { actor: staffActor, retryDelayMs: 0, logger: () => undefined, mode: "production" },
    );
    expect(await client.call("settings.values.update", { values: { "demo.greeting": "hi" } })).toMatchObject({
      ok: false,
      error: { code: "access.forbidden" },
    });
  });
});

describe("a capability handler reading a setting through its context", () => {
  it("sees the preset's override", async () => {
    const reader = createSettingsReader(registry, { "demo.stay_minutes": 45 });
    const adapter = createMockAdapter({
      handlers: {
        ...mockHandler(demoStay, (_input, { settings }) => ok(settings.get(stay))),
      },
      store: createSessionStore({}),
      clock,
      settings: reader,
    });
    const client = createClient({ "demo.stay.get": demoStay }, adapter, {
      actor: staffActor,
      retryDelayMs: 0,
      logger: () => undefined,
      mode: "production",
    });
    expect(await client.call("demo.stay.get", {})).toEqual(ok(45));
  });
});
