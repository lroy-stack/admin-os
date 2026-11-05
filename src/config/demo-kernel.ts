import "server-only";

import { permissionsOf } from "@/core/access";
import type { ClockSeed } from "@/core/clock";
import { type HeldWrites, kernelMockHandlers, type MockHandler } from "@/core/mock";
import { createSettingsReader, type SettingsReader } from "@/core/settings";
import { hospitalityClock, hospitalitySeed } from "@/verticals/hospitality/server";
import { salonClock, salonSeed } from "@/verticals/salon/server";
import { workshopClock, workshopSeed } from "@/verticals/workshop/server";

import { CATALOG } from "./catalog";
import { MODULE_SERVERS } from "./modules.server.generated";
import { SETTINGS } from "./settings";
import { VERTICALS, type VerticalId } from "./vertical";

/** The settings in effect for a preset: registry defaults with the preset's overrides (ADR 0004). */
export const settingsFor = (vertical: VerticalId): SettingsReader =>
  createSettingsReader(SETTINGS, VERTICALS[vertical].settingsDefaults);

/** What approving a held write needs: the catalogue, and what each role of the preset holds today (ADR 0016, D7). */
export const heldWritesFor = (vertical: VerticalId): HeldWrites => ({
  catalog: CATALOG,
  permissionsOfRole: (roleId) => {
    const { roles, modules } = VERTICALS[vertical];
    const role = roles.find((preset) => preset.id === roleId);
    return role ? permissionsOf(role, CATALOG, modules) : [];
  },
});

/** The demo data of each preset: its seed collections and its seeded business clock (ADR 0004, 0005). */
export const DEMO = {
  hospitality: { seed: hospitalitySeed, clock: hospitalityClock },
  salon: { seed: salonSeed, clock: salonClock },
  workshop: { seed: workshopSeed, clock: workshopClock },
} as const satisfies Record<VerticalId, { seed: unknown; clock: ClockSeed }>;

export type DemoSeed = (typeof DEMO)[VerticalId]["seed"];

/**
 * Each installed module's mock answers, typed against every preset's seed: a handler that reads a collection or a
 * field no seed has does not compile (the annotation is the check, so no cast belongs here).
 */
const moduleHandlers: readonly Readonly<Record<string, MockHandler<DemoSeed>>>[] = MODULE_SERVERS.map(
  ({ mockHandlers }) => mockHandlers,
);

/** Every capability's mock answer; a contract test checks that the catalogue has no capability without one. */
export const MOCK_HANDLERS: Readonly<Record<string, MockHandler<DemoSeed>>> = Object.fromEntries(
  [kernelMockHandlers, ...moduleHandlers].flatMap((handlers) => Object.entries(handlers)),
);
