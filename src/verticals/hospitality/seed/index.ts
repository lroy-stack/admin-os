/**
 * Hospitality mock data in the generic contracts: the bookings screen reads this day through the data seam. Times are
 * minutes from midnight; "now" is 20:40. Guests that are not customers are named by `contactName`.
 */
import { bookings } from "./bookings";
import { catalog } from "./catalog";
import { customers } from "./customers";
import { purchaseOrders, stockItems } from "./inventory";
import { parties } from "./parties";
import { areas, resources } from "./resources";
import { shifts, staff } from "./staff";

export { BUSINESS_DAY } from "./shared";

export const hospitalitySeed = {
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
