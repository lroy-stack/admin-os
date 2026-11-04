export const orderFilters = ["all", "needsAction", "unfulfilled", "unpaid", "returns"] as const;

export type OrderFilter = (typeof orderFilters)[number];

/** Demo orders: `total` is in major units of the business currency and `date` is the shop's wall-clock time. */
export type OrderRow = {
  id: string;
  date: string;
  customer: string;
  channel: "onlineStore" | "marketplace" | "social" | "retail";
  payment: "paid" | "pending" | "refunded";
  total: number;
  itemCount: number;
  fulfillment: "fulfilled" | "returned" | "unfulfilled";
};
