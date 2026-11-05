import { DEFAULT_ROLES } from "@/core/access";
import type { NavManifest } from "@/core/nav";

import { salonBusiness } from "./business";
import { catalogItemExtSchema, customerExtSchema, staffExtSchema } from "./extensions";

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

export const salon = {
  id: "salon",
  modules: ["bookings", "customers", "notifications", "resources", "staff", "catalog", "parties", "inventory"],
  nav,
  roles: DEFAULT_ROLES,
  extensions: {
    customer: customerExtSchema,
    catalogItem: catalogItemExtSchema,
    staff: staffExtSchema,
  },
  /** A haircut is 45 minutes, so a walk-in is expected to stay that long. */
  settingsDefaults: {
    ...salonBusiness,
    "bookings.walk_in.stay_minutes": 45,
    "bookings.service_window": { startMin: 9 * 60, endMin: 18 * 60 },
  },
  /** The product views it offers, in order (ADR 0018 §3): the shop and its stock. */
  productViews: [
    { id: "shop", kind: "catalog.collection", labelKey: "catalog.collections.shop", params: { categoryIds: ["shop"] } },
    { id: "stock", kind: "inventory.stock", labelKey: "inventory.views.stock", params: {} },
  ],
  /** Words that must never appear in the generic layers (ADR 0008). */
  leakTerms: ["stylist", "haircut"],
  // A confirmed booking that counts as late on the seeded clock, a resource free at `freeAt`, the first customer and party.
  contractIds: {
    bookings: { lateConfirmed: "A-201", free: "chair-3", freeAt: 15 * 60 },
    customers: { customer: "client-nora" },
    parties: { party: "hotel-spa" },
  },
} as const;
