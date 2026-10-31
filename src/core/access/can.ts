import type { Permission } from "@/core/capability";

/** What the UI knows about the actor's rights: the permission slugs the adapter granted (ADR 0006). */
export interface Access {
  readonly permissions: readonly string[];
}

/** Pure and fail-closed: a permission the actor does not hold, or that nobody defined, is `false`. */
export function can(access: Access, permission: Permission): boolean {
  return access.permissions.includes(permission);
}
