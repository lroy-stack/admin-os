import { Armchair, CalendarDays, Scissors, UserCog, Users } from "lucide-react";

import { DEFAULT_ROLES } from "@/core/access";
import type { NavManifest } from "@/core/nav";

import { catalogItemExtSchema, customerExtSchema, staffExtSchema } from "./extensions";

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
    id: "catalog",
    href: "/dashboard/catalog",
    labelKey: "catalog.title",
    icon: Scissors,
    placement: "area",
    group: "business",
    requiredPermission: "read:catalog",
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
] as const satisfies NavManifest;

export const salon = {
  id: "salon",
  modules: ["bookings", "customers", "resources", "staff", "catalog"],
  nav,
  roles: DEFAULT_ROLES,
  extensions: {
    customer: customerExtSchema,
    catalogItem: catalogItemExtSchema,
    staff: staffExtSchema,
  },
  /** Words that must never appear in the generic layers (ADR 0008). */
  leakTerms: ["stylist", "haircut"],
} as const;
