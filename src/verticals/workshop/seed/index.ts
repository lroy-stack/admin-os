/** Workshop seed sketch: a drop-off on a bay, a vehicle as a customer asset, parts and labour as catalog items. */
import { bookings } from "./bookings";
import { catalog } from "./catalog";
import { assets, customers } from "./customers";
import { purchaseOrders, stockItems } from "./inventory";
import { parties } from "./parties";
import { areas, resources } from "./resources";
import { staff } from "./staff";

export { BUSINESS_DAY } from "./shared";

export const workshopSeed = {
  areas,
  resources,
  customers,
  assets,
  parties,
  catalog,
  stockItems,
  purchaseOrders,
  staff,
  bookings,
} as const;
