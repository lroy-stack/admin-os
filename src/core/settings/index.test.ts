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
  settingsCapabilities,
  settingsValuesGet,
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

const registry = mergeSettings(stay, greeting);

describe("mergeSettings", () => {
  it("refuses two settings with the same key", () => {
    expect(() => mergeSettings(stay, stay)).toThrow(/Duplicate setting key "demo.stay_minutes"/);
  });
});

describe("createSettingsReader", () => {
  it("returns the default when the preset does not override", () => {
    expect(createSettingsReader(registry).get("demo.stay_minutes")).toBe(90);
  });

  it("returns the preset override over the default", () => {
    expect(createSettingsReader(registry, { "demo.stay_minutes": 45 }).get("demo.stay_minutes")).toBe(45);
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
      ok({ "demo.stay_minutes": 90, "demo.greeting": "hi" }),
    );
  });

  it("lists only the asked keys", () => {
    expect(createSettingsReader(registry).values(["demo.greeting"])).toEqual(ok({ "demo.greeting": "hello" }));
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
      ok({ values: { "demo.stay_minutes": 45, "demo.greeting": "hello" } }),
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

describe("a capability handler reading a setting through its context", () => {
  it("sees the preset's override", async () => {
    const reader = createSettingsReader(registry, { "demo.stay_minutes": 45 });
    const adapter = createMockAdapter({
      handlers: {
        ...mockHandler(demoStay, (_input, { settings }) => ok(Number(settings.get("demo.stay_minutes")))),
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
