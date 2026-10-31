import type { LucideIcon } from "lucide-react";

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
