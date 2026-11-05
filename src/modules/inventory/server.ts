import "server-only";

import type { ModuleServer } from "@/core/module";

import { inventoryMessages } from "./messages";
import { inventoryMockHandlers } from "./mock";
import { inventoryModule } from "./module";

export * from "./messages";

/** The server half of the inventory module (ADR 0017 §1): its messages and its mock answers. */
export const inventoryModuleServer = {
  id: inventoryModule.id,
  messages: inventoryMessages,
  mockHandlers: inventoryMockHandlers,
} satisfies ModuleServer<typeof inventoryModule.id>;
