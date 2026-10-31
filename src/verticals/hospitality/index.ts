import { Armchair, CalendarDays, UserCog, Users, UtensilsCrossed } from "lucide-react";

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

const nav = [
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
    icon: Users,
    placement: "area",
    group: "business",
    requiredPermission: "read:customers",
  },
  {
    id: "staff",
    href: "/dashboard/staff",
    labelKey: "staff.title",
    icon: UserCog,
    placement: "area",
    group: "operations",
    requiredPermission: "read:staff",
  },
  {
    id: "resources",
    href: "/dashboard/resources",
    labelKey: "resources.title",
    icon: Armchair,
    placement: "tool",
    group: "operations",
    requiredPermission: "read:resources",
  },
  {
    id: "catalog",
    href: "/dashboard/catalog",
    labelKey: "catalog.title",
    icon: UtensilsCrossed,
    placement: "tool",
    group: "business",
    requiredPermission: "read:catalog",
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
  /** Words that must never appear in the generic layers (ADR 0008). */
  leakTerms: ["diner", "dining", "covers", "waiter", "allergen", "dish", "restaurant", "mesa", "comensal", "carta"],
} as const;
