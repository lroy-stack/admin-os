import "server-only";

import type { ModuleServer } from "@/core/module";

import { customersMessages } from "./messages";
import { customersMockHandlers } from "./mock";
import { customersModule } from "./module";

export * from "./contact-fields-messages";
export * from "./messages";

/** The server half of the customers module (ADR 0017 §1): its messages and its mock answers. */
export const customersModuleServer = {
  id: customersModule.id,
  messages: customersMessages,
  mockHandlers: customersMockHandlers,
} satisfies ModuleServer<typeof customersModule.id>;
