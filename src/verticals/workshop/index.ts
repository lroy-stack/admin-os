import { CalendarClock, House } from "lucide-react";

import { DEFAULT_ROLES } from "@/core/access";
import type { NavManifest } from "@/core/nav";

import { assetExtSchema, bookingExtSchema, catalogItemExtSchema, staffExtSchema } from "./extensions";

/**
 * Only routes that exist are listed (ADR 0006). Home points at the overview route until the Home screen replaces it;
 * the other areas join with their modules' screens.
 */
const nav = [
  {
    id: "home",
    href: "/dashboard/default",
    labelKey: "nav.home",
    icon: House,
    placement: "area",
    group: "overview",
    requiredModule: "access",
  },
  {
    id: "bookings",
    href: "/dashboard/bookings",
    labelKey: "bookings.title",
    icon: CalendarClock,
    placement: "area",
    group: "operations",
    requiredPermission: "read:bookings",
  },
] as const satisfies NavManifest;

export const workshop = {
  id: "workshop",
  modules: ["bookings", "customers", "resources", "staff", "catalog"],
  nav,
  roles: DEFAULT_ROLES,
  extensions: {
    booking: bookingExtSchema,
    asset: assetExtSchema,
    catalogItem: catalogItemExtSchema,
    staff: staffExtSchema,
  },
  /** Workshop jobs are booked in half-hour slots. */
  settingsDefaults: { "bookings.slot_minutes": 30 },
  /** Words that must never appear in the generic layers (ADR 0008). */
  leakTerms: ["vehicle", "mechanic"],
} as const;
