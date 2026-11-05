import "server-only";

import type { ModuleServer } from "@/core/module";

import { inventoryMessages } from "./messages";
import { inventoryMockHandlers } from "./mock";
import { inventoryModule } from "./module";
import { loadOrders, loadStock } from "./view-loaders";
import { inventoryViewsBundle } from "./views-messages";

export * from "./messages";
export * from "./views-messages";

/** The server half of the inventory module (ADR 0017 §1): its messages, its mock answers and its view loaders. */
export const inventoryModuleServer = {
  id: inventoryModule.id,
  messages: inventoryMessages,
  mockHandlers: inventoryMockHandlers,
  viewLoaders: { "inventory.stock": loadStock, "inventory.orders": loadOrders },
  viewBundles: { "inventory.stock": inventoryViewsBundle, "inventory.orders": inventoryViewsBundle },
} satisfies ModuleServer<typeof inventoryModule.id>;
