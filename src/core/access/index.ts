import type { AnyCapability, Catalog, Permission } from "@/core/capability";
import type { ModuleId } from "@/core/nav";

export const ROLE_IDS = ["owner", "manager", "staff"] as const;

export type RoleId = (typeof ROLE_IDS)[number];

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

/** The distinct permissions of the catalogue, sorted, restricted to the enabled modules. A disabled module grants none. */
export function catalogPermissions(catalog: Catalog, enabledModules: readonly ModuleId[]): Permission[] {
  const enabled = new Set(enabledModules);
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
  const enabled = new Set(enabledModules);
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
