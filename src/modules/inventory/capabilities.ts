import { defineCapability } from "@/core/capability";
import { pageOutput } from "@/core/pagination";

import { ordersListInput, purchaseOrderRowSchema, stockItemRowSchema, stockListInput } from "./schema";

export const inventoryStockList = defineCapability({
  id: "inventory.stock.list",
  summary:
    "List the stock the business keeps, one page at a time. Each row names its supplier (supplierName) when it has one. Set belowReorder to see only what is at or under its reorder point.",
  input: stockListInput,
  output: pageOutput(stockItemRowSchema),
  permission: "read:inventory",
  effect: "read",
  riskTier: 1,
});

export const inventoryOrdersList = defineCapability({
  id: "inventory.orders.list",
  summary:
    "List purchase orders, one page at a time, optionally by status. Each row names its supplier (supplierName) when it has one.",
  input: ordersListInput,
  output: pageOutput(purchaseOrderRowSchema),
  permission: "read:inventory",
  effect: "read",
  riskTier: 1,
});

export const inventoryCapabilities = {
  "inventory.stock.list": inventoryStockList,
  "inventory.orders.list": inventoryOrdersList,
} as const;
