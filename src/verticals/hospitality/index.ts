import { CalendarDays, House, UsersRound } from "lucide-react";

import { DEFAULT_ROLES } from "@/core/access";
import type { NavManifest } from "@/core/nav";

import {
  areaExtSchema,
  bookingExtSchema,
  catalogItemExtSchema,
  customerExtSchema,
  resourceExtSchema,
  staffExtSchema,
} from "./extensions";

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
    icon: CalendarDays,
    placement: "area",
    group: "operations",
    requiredPermission: "read:bookings",
  },
  {
    id: "customers",
    href: "/dashboard/customers",
    labelKey: "customers.title",
    icon: UsersRound,
    placement: "area",
    group: "operations",
    requiredPermission: "read:customers",
  },
] as const satisfies NavManifest;

export const hospitality = {
  id: "hospitality",
  modules: ["bookings", "customers", "resources", "staff", "catalog"],
  nav,
  roles: DEFAULT_ROLES,
  extensions: {
    booking: bookingExtSchema,
    customer: customerExtSchema,
    catalogItem: catalogItemExtSchema,
    resource: resourceExtSchema,
    area: areaExtSchema,
    staff: staffExtSchema,
  },
  settingsDefaults: {},
  /** Words that must never appear in the generic layers (ADR 0008). */
  leakTerms: ["diner", "dining", "covers", "waiter", "allergen", "dish", "restaurant", "mesa", "comensal", "carta"],
} as const;
