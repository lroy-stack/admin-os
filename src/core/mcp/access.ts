import type { AnyCapability, Catalog } from "@/core/capability";

/**
 * Read and write are separate grants (spec 004 D3): the one pure decision behind `tools/list`, dispatch and the MCP
 * Worker's step-up challenge. Effective permissions are the role's permissions ∩ the effects of the granted scopes.
 */

/** The scopes of the one MCP resource: `read` is the default grant, `write` its own explicit consent. */
export const SCOPES = ["read", "write"] as const;

export type Scope = (typeof SCOPES)[number];

/** What a grant names that this server does not know is ignored: it grants nothing. */
export const scopesOf = (granted: readonly string[]): readonly Scope[] =>
  SCOPES.filter((scope) => granted.includes(scope));

/** The permissions of capabilities whose effect is `read`, and of no other: a slug a write shares is a write's. */
const readOnlyPermissions = (catalog: Catalog): ReadonlySet<string> => {
  const capabilities = Object.values(catalog);
  const written = new Set(capabilities.filter((capability) => capability.effect !== "read").map((c) => c.permission));
  return new Set(
    capabilities.map((capability) => capability.permission).filter((permission) => !written.has(permission)),
  );
};

/**
 * The permissions a caller acts with: `read` keeps the role's read permissions, `write` adds its writes. `write`
 * includes `read` (servers must account for scope hierarchies), and no scope keeps nothing.
 */
export function effectivePermissions(
  catalog: Catalog,
  rolePermissions: readonly string[],
  scopes: readonly Scope[],
): string[] {
  if (scopes.includes("write")) return [...rolePermissions];
  if (!scopes.includes("read")) return [];
  const reads = readOnlyPermissions(catalog);
  return rolePermissions.filter((permission) => reads.has(permission));
}

/**
 * Whether `capability` is refused only for want of `write`: a write the role holds, which the scopes do not grant.
 * That is the one case the step-up challenge (`403 insufficient_scope`) is for; a write the role lacks stays
 * `access.forbidden`, since no consent can grant it (ADR 0016, resolution 1).
 */
export const needsWriteScope = (
  catalog: Catalog,
  capability: AnyCapability,
  rolePermissions: readonly string[],
  scopes: readonly Scope[],
): boolean =>
  capability.effect !== "read" &&
  rolePermissions.includes(capability.permission) &&
  !effectivePermissions(catalog, rolePermissions, scopes).includes(capability.permission);
