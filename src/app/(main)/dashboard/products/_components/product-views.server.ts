import "server-only";

import { CATALOG } from "@/config/catalog";
import { MODULES } from "@/config/modules.generated";
import type { ViewEntry } from "@/core/views";

/** What decides whether a view is shown (ADR 0018 §3): the installed kinds, the preset's modules and the actor. */
export interface ViewAccess {
  readonly kinds: readonly { readonly id: string; readonly module: string; readonly capability: string }[];
  /** The modules the preset enables. */
  readonly modules: readonly string[];
  /** What the actor holds. */
  readonly permissions: readonly string[];
  /** The permission a capability needs, or undefined when nobody defined it. */
  readonly permissionOf: (capability: string) => string | undefined;
}

/**
 * The entries the viewer may see, in the preset's order. It fails closed: a view of a kind nobody declares, of a
 * module the preset does not enable, or whose capability the actor may not call is left out.
 */
export function visibleViews<Entry extends ViewEntry>(entries: readonly Entry[], access: ViewAccess): Entry[] {
  return entries.filter((entry) => {
    const kind = access.kinds.find(({ id }) => id === entry.kind);
    if (kind === undefined || !access.modules.includes(kind.module)) return false;
    const permission = access.permissionOf(kind.capability);
    return permission !== undefined && access.permissions.includes(permission);
  });
}

/** `visibleViews` with the installed modules' kinds and the kit's capability catalogue. */
export const readableViews = (
  entries: readonly ViewEntry[],
  modules: readonly string[],
  permissions: readonly string[],
): ViewEntry[] =>
  visibleViews(entries, {
    kinds: MODULES.flatMap((module) => module.views ?? []),
    modules,
    permissions,
    permissionOf: (capability) => CATALOG[capability]?.permission,
  });
