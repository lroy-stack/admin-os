/** Salon mock data in the generic contracts: stylist = staffIds, chair = resourceIds, services = lines. */
import { bookings } from "./bookings";
import { catalog } from "./catalog";
import { customers } from "./customers";
import { purchaseOrders, stockItems } from "./inventory";
import { parties } from "./parties";
import { areas, resources } from "./resources";
import { shifts, staff } from "./staff";

export { BUSINESS_DAY } from "./shared";

export const salonSeed = {
  areas,
  resources,
  customers,
  parties,
  catalog,
  stockItems,
  purchaseOrders,
  staff,
  shifts,
  bookings,
} as const;
