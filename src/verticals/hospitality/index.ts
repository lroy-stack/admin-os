import { DEFAULT_ROLES } from "@/core/access";
import type { NavManifest } from "@/core/nav";

import { hospitalityBusiness } from "./business";
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
    placement: "area",
    group: "overview",
    requiredModule: "access",
  },
  {
    id: "bookings",
    href: "/dashboard/bookings",
    labelKey: "bookings.title",
    placement: "area",
    group: "operations",
    requiredPermission: "read:bookings",
  },
  {
    id: "customers",
    href: "/dashboard/customers",
    labelKey: "customers.title",
    placement: "area",
    group: "operations",
    requiredPermission: "read:customers",
  },
  {
    id: "products",
    href: "/dashboard/products",
    labelKey: "catalog.products",
    placement: "area",
    group: "operations",
    requiredPermission: "read:catalog",
  },
] as const satisfies NavManifest;

export const hospitality = {
  id: "hospitality",
  modules: ["bookings", "customers", "notifications", "resources", "staff", "catalog"],
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
  settingsDefaults: { ...hospitalityBusiness },
  /** The product views it offers, in order (ADR 0018 §3): the menu and the shop. */
  productViews: [
    {
      id: "menu",
      kind: "catalog.collection",
      labelKey: "catalog.title",
      params: { categoryIds: ["starters", "mains", "desserts", "menus"] },
    },
    { id: "shop", kind: "catalog.collection", labelKey: "catalog.collections.shop", params: { categoryIds: ["shop"] } },
  ],
  /** Words that must never appear in the generic layers (ADR 0008). */
  leakTerms: ["diner", "dining", "covers", "waiter", "allergen", "dish", "restaurant", "mesa", "comensal", "carta"],
} as const;
