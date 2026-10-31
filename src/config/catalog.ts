import { mergeCatalogs } from "@/core/capability";
import { bookingsCapabilities } from "@/modules/bookings";
import { catalogCapabilities } from "@/modules/catalog";
import { customersCapabilities } from "@/modules/customers";
import { resourcesCapabilities } from "@/modules/resources";
import { staffCapabilities } from "@/modules/staff";

/** Every capability the kit ships. A preset enables a subset of its modules (ADR 0004). */
export const CATALOG = mergeCatalogs(
  bookingsCapabilities,
  catalogCapabilities,
  customersCapabilities,
  resourcesCapabilities,
  staffCapabilities,
);
