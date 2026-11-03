import { accessCapabilities } from "@/core/access";
import { mergeCatalogs } from "@/core/capability";
import { clockCapabilities } from "@/core/clock";
import { settingsCapabilities } from "@/core/settings";
import { bookingsCapabilities } from "@/modules/bookings";
import { catalogCapabilities } from "@/modules/catalog";
import { customersCapabilities } from "@/modules/customers";
import { resourcesCapabilities } from "@/modules/resources";
import { staffCapabilities } from "@/modules/staff";

/** Every capability the kit ships. A preset enables a subset of its modules; kernel modules are always on (ADR 0004). */
export const CATALOG = mergeCatalogs(
  accessCapabilities,
  clockCapabilities,
  settingsCapabilities,
  bookingsCapabilities,
  catalogCapabilities,
  customersCapabilities,
  resourcesCapabilities,
  staffCapabilities,
);
