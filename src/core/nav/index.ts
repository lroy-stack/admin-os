import type { LucideIcon } from "lucide-react";

import { type Access, can, KERNEL_MODULES } from "@/core/access";
import type { Permission } from "@/core/capability";

/** The id of a module (`bookings`, `customers`, ...). It is the first segment of its capability ids. */
export type ModuleId = string;

/**
 * One entry of a preset's navigation (ADR 0006). Visibility is fail-closed: an entry with neither gate is hidden,
 * and a gate on a disabled module hides it too.
 */
export interface NavEntry {
  /** Stable id, for example `"bookings"`. */
  readonly id: string;
  /** For example `"/dashboard/bookings"`. */
  readonly href: string;
  /** Key of a module message (for example `"bookings.title"`), so the preset vocabulary can override the label. */
  readonly labelKey: string;
  readonly icon: LucideIcon;
  /** Top-nav pill or tools rail. */
  readonly placement: "area" | "tool";
  /** Preset group id. */
  readonly group: string;
  /** `"wide"`: shown from the `wide` breakpoint, in "More" below it. */
  readonly presentation?: "always" | "wide";
  /** Decides visibility when present. */
  readonly requiredPermission?: Permission;
  /** For aggregator screens that have no permission of their own. */
  readonly requiredModule?: ModuleId;
}

export type NavManifest = readonly NavEntry[];

/** Kernel modules every preset has; an entry gated on one of them is visible in every preset. */
const ALWAYS_ENABLED: readonly ModuleId[] = KERNEL_MODULES;

/**
 * Ids of the entries this actor may see, in manifest order (ADR 0006). Pure and fail-closed:
 * - an entry with a permission gate is visible only to an actor who holds it;
 * - an entry with a module gate is visible only when the module is enabled (or a kernel module);
 * - an entry with both needs both; an entry with neither is hidden.
 */
export function visibleNavIds(manifest: NavManifest, access: Access, enabledModules: readonly ModuleId[]): string[] {
  const enabled = new Set<ModuleId>([...ALWAYS_ENABLED, ...enabledModules]);
  return manifest
    .filter((entry) => {
      const gated = entry.requiredPermission !== undefined || entry.requiredModule !== undefined;
      const permitted = entry.requiredPermission === undefined || can(access, entry.requiredPermission);
      const available = entry.requiredModule === undefined || enabled.has(entry.requiredModule);
      return gated && permitted && available;
    })
    .map((entry) => entry.id);
}
