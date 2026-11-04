import { permissionsOf, type RoleId } from "@/core/access";
import type { Actor } from "@/core/client";

import { CATALOG } from "./catalog";
import type { VERTICALS, VerticalId } from "./vertical";

/** The person every demo role acts as: the account menu shows them, and notes they write carry their name. */
export const DEMO_PERSON = { name: "Alex Morgan", email: "alex.morgan@example.com" } as const;

/**
 * The demo actor for a role preset (ADR 0006): the UI resolves the role from the `demo_role` cookie, the MCP
 * transports from a demo token or an environment variable (ADR 0009). Both get the same permissions.
 */
export function demoActor(roleId: RoleId, vertical: (typeof VERTICALS)[VerticalId]): Actor {
  const role = vertical.roles.find((preset) => preset.id === roleId);
  return {
    actorId: `demo-${roleId}`,
    displayName: DEMO_PERSON.name,
    roleId,
    permissions: role ? permissionsOf(role, CATALOG, vertical.modules) : [],
  };
}
