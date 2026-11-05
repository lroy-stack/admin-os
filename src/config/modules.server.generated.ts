// Written by `npm run generate:modules` from the folders of src/modules; do not edit. A test fails when it is stale (ADR 0017 §5).
import "server-only";

import type { ServersOf } from "@/core/module";
import { bookingsModuleServer } from "@/modules/bookings/server";
import { catalogModuleServer } from "@/modules/catalog/server";
import { customersModuleServer } from "@/modules/customers/server";
import { inventoryModuleServer } from "@/modules/inventory/server";
import { notificationsModuleServer } from "@/modules/notifications/server";
import { partiesModuleServer } from "@/modules/parties/server";
import { resourcesModuleServer } from "@/modules/resources/server";
import { staffModuleServer } from "@/modules/staff/server";

import type { MODULES } from "./modules.generated";

/** The server halves of the installed modules, in the order of `MODULES`: their messages and mock answers. */
export const MODULE_SERVERS = [
  bookingsModuleServer,
  catalogModuleServer,
  customersModuleServer,
  inventoryModuleServer,
  notificationsModuleServer,
  partiesModuleServer,
  resourcesModuleServer,
  staffModuleServer,
] as const satisfies ServersOf<typeof MODULES>;
