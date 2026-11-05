import { z } from "zod";

import { defineModule } from "@/core/module";
import { defineViewKind } from "@/core/views";

import { inventoryCapabilities } from "./capabilities";
import { purchaseOrderSchema, stockItemSchema } from "./schema";

/** What the business keeps, read through `inventory.stock.list` (ADR 0018 §3). */
export const inventoryStockView = defineViewKind({
  id: "inventory.stock",
  module: "inventory",
  capability: "inventory.stock.list",
  params: z.object({}),
});

/** What the business has bought or is buying, read through `inventory.orders.list` (ADR 0018 §3). */
export const inventoryOrdersView = defineViewKind({
  id: "inventory.orders",
  module: "inventory",
  capability: "inventory.orders.list",
  params: z.object({}),
});

/** The inventory module's manifest (ADR 0017 §1, ADR 0018): what the business keeps and buys. Reads only. */
export const inventoryModule = defineModule({
  id: "inventory",
  capabilities: inventoryCapabilities,
  settings: [],
  mcp: {
    noun: "inventory",
    idSources: [],
    tools: {
      "inventory.stock.list": { expose: true, title: "List stock" },
      "inventory.orders.list": { expose: true, title: "List purchase orders" },
    },
  },
  seed: {
    stockItems: { schema: stockItemSchema, required: true, ext: { entity: "stockItem", optional: true } },
    purchaseOrders: { schema: purchaseOrderSchema, required: true, ext: { entity: "purchaseOrder", optional: true } },
  },
  references: [
    { collection: "stockItems", field: "catalogItemId", module: "catalog", required: false },
    { collection: "stockItems", field: "supplierId", module: "parties", required: false },
    { collection: "purchaseOrders", field: "supplierId", module: "parties", required: false },
  ],
  owns: ["src/config/inventory-units.test.ts", "src/config/mcp.server.inventory.test.ts"],
  views: [inventoryStockView, inventoryOrdersView],
});
