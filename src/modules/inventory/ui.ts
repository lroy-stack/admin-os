import type { ModuleUi } from "@/core/views/ui";

import { OrdersView } from "./views/orders";
import { StockView } from "./views/stock";

/** The client half of the inventory module (ADR 0017 §1): the renderers of its product view kinds. */
export const inventoryModuleUi = {
  views: { "inventory.stock": StockView, "inventory.orders": OrdersView },
} as const satisfies ModuleUi;
