import { permissionsOf, type RoleId } from "@/core/access";
import type { Actor } from "@/core/client";
import { users } from "@/data/users";

import { CATALOG } from "./catalog";
import type { VERTICALS, VerticalId } from "./vertical";

/**
 * The demo actor for a role preset (ADR 0006): the UI resolves the role from the `demo_role` cookie, the MCP
 * transports from a demo token or an environment variable (ADR 0009). Both get the same permissions.
 */
export function demoActor(roleId: RoleId, vertical: (typeof VERTICALS)[VerticalId]): Actor {
  const role = vertical.roles.find((preset) => preset.id === roleId);
  return {
    actorId: `demo-${roleId}`,
    displayName: users[0]?.name ?? roleId,
    roleId,
    permissions: role ? permissionsOf(role, CATALOG, vertical.modules) : [],
  };
}
