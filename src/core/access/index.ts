import { z } from "zod";

import { type AnyCapability, type Catalog, defineCapability, type Permission } from "@/core/capability";
import type { ModuleId } from "@/core/nav";

export { type Access, can } from "./can";

export const ROLE_IDS = ["owner", "manager", "staff"] as const;

export type RoleId = (typeof ROLE_IDS)[number];

export const roleIdSchema = z.enum(ROLE_IDS);

/**
 * How a role is derived from the catalogue (ADR 0006):
 * - `everything`: every permission of the enabled modules;
 * - `all-but-elevated`: the same without the elevated ones (capabilities flagged `elevated`);
 * - `reads-and-writes`: reads and non-destructive writes, without the elevated ones.
 *
 * A permission is granted only if every capability carrying it passes the rule, so a slug shared by a safe and a
 * destructive capability is never handed out by accident.
 */
export type RoleRule = "everything" | "all-but-elevated" | "reads-and-writes";

/** A role is data: the catalogue and the enabled modules turn it into permissions with `permissionsOf`. */
export interface RolePreset {
  readonly id: RoleId;
  /** Key of a message, for example `"access.roles.owner"`; the preset vocabulary may override it. */
  readonly labelKey: string;
  readonly rule: RoleRule;
}

/** The module a capability belongs to: the first segment of its id. */
export function moduleOf(capabilityId: string): ModuleId {
  return capabilityId.split(".")[0] as ModuleId;
}

/**
 * Modules every preset has, whatever it enables: the actor reads itself (`access.me.get`) and the business clock
 * (`clock.get`). They grant no business data.
 */
export const KERNEL_MODULES = ["access", "clock"] as const satisfies readonly ModuleId[];

const inScopeModules = (enabledModules: readonly ModuleId[]) =>
  new Set<ModuleId>([...KERNEL_MODULES, ...enabledModules]);

/** The distinct permissions of the catalogue, sorted, restricted to the enabled and kernel modules. */
export function catalogPermissions(catalog: Catalog, enabledModules: readonly ModuleId[]): Permission[] {
  const enabled = inScopeModules(enabledModules);
  const permissions = Object.entries(catalog)
    .filter(([id]) => enabled.has(moduleOf(id)))
    .map(([, capability]) => capability.permission);
  return [...new Set(permissions)].sort();
}

function allows(rule: RoleRule, capability: AnyCapability): boolean {
  switch (rule) {
    case "everything":
      return true;
    case "all-but-elevated":
      return capability.elevated !== true;
    case "reads-and-writes":
      return capability.effect !== "destructive" && capability.elevated !== true;
  }
}

/** The permissions a role holds over the catalogue, restricted to the enabled modules. */
export function permissionsOf(role: RolePreset, catalog: Catalog, enabledModules: readonly ModuleId[]): Permission[] {
  const enabled = inScopeModules(enabledModules);
  const inScope = Object.entries(catalog)
    .filter(([id]) => enabled.has(moduleOf(id)))
    .map(([, capability]) => capability);
  const denied = new Set(inScope.filter((capability) => !allows(role.rule, capability)).map((c) => c.permission));
  const granted = inScope.map((capability) => capability.permission).filter((permission) => !denied.has(permission));
  return [...new Set(granted)].sort();
}

/** The role set every preset starts from; a preset may relabel a role through its vocabulary. */
export const DEFAULT_ROLES = [
  { id: "owner", labelKey: "access.roles.owner", rule: "everything" },
  { id: "manager", labelKey: "access.roles.manager", rule: "all-but-elevated" },
  { id: "staff", labelKey: "access.roles.staff", rule: "reads-and-writes" },
] as const satisfies readonly RolePreset[];

/** The calling actor as the adapter sees it (ADR 0006); the UI and the MCP server both start from it. */
export const actorSchema = z.object({
  actorId: z.string().min(1),
  displayName: z.string().min(1),
  roleId: z.string().min(1),
  permissions: z.array(z.string()),
});

export const accessMeGet = defineCapability({
  id: "access.me.get",
  summary: "Who is calling: actor id, display name, role and permissions.",
  input: z.strictObject({}),
  output: actorSchema,
  permission: "read:access",
  effect: "read",
  riskTier: 1,
});

export const accessCapabilities = { "access.me.get": accessMeGet } as const;
