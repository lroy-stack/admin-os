import { CalendarClock, LayoutGrid, UserCog, Users, Wrench } from "lucide-react";

import { DEFAULT_ROLES } from "@/core/access";
import type { NavManifest } from "@/core/nav";

import { assetExtSchema, bookingExtSchema, catalogItemExtSchema, staffExtSchema } from "./extensions";

const nav = [
  {
    id: "bookings",
    href: "/dashboard/bookings",
    labelKey: "bookings.title",
    icon: CalendarClock,
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
    id: "resources",
    href: "/dashboard/resources",
    labelKey: "resources.title",
    icon: LayoutGrid,
    placement: "area",
    group: "operations",
    requiredPermission: "read:resources",
  },
  {
    id: "catalog",
    href: "/dashboard/catalog",
    labelKey: "catalog.title",
    icon: Wrench,
    placement: "tool",
    group: "business",
    requiredPermission: "read:catalog",
  },
  {
    id: "staff",
    href: "/dashboard/staff",
    labelKey: "staff.title",
    icon: UserCog,
    placement: "tool",
    group: "operations",
    requiredPermission: "read:staff",
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
  /** Words that must never appear in the generic layers (ADR 0008). */
  leakTerms: ["vehicle", "mechanic"],
} as const;
