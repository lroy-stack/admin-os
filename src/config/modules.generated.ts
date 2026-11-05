// Written by `npm run generate:modules` from the folders of src/modules; do not edit. A test fails when it is stale (ADR 0017 §5).

import { bookingsModule } from "@/modules/bookings";
import { catalogModule } from "@/modules/catalog";
import { customersModule } from "@/modules/customers";
import { inventoryModule } from "@/modules/inventory";
import { notificationsModule } from "@/modules/notifications";
import { partiesModule } from "@/modules/parties";
import { resourcesModule } from "@/modules/resources";
import { staffModule } from "@/modules/staff";

/** The installed modules: the composition root reads their manifests from here. */
export const MODULES = [
  bookingsModule,
  catalogModule,
  customersModule,
  inventoryModule,
  notificationsModule,
  partiesModule,
  resourcesModule,
  staffModule,
] as const;

export type InstalledModuleId = (typeof MODULES)[number]["id"];

/** What each installed module requires, from every import between module folders (ADR 0017 §2). */
export const MODULE_GRAPH = {
  bookings: ["resources"],
  catalog: [],
  customers: [],
  inventory: [],
  notifications: ["bookings"],
  parties: [],
  resources: [],
  staff: [],
} as const satisfies Readonly<Record<InstalledModuleId, readonly InstalledModuleId[]>>;

/** Entities whose `ext` slot a preset may type (ADR 0004): the `ext` entities of the modules' seed collections. */
export type ExtensionEntity =
  | "area"
  | "asset"
  | "booking"
  | "catalogItem"
  | "customer"
  | "party"
  | "purchaseOrder"
  | "resource"
  | "staff"
  | "stockItem";
