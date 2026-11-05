import "server-only";

import type { ModuleServer } from "@/core/module";

import { resourcesMessages } from "./messages";
import { resourcesMockHandlers } from "./mock";
import { resourcesModule } from "./module";

/** The server half of the resources module (ADR 0017 §1): its messages and its mock answers. */
export const resourcesModuleServer = {
  id: resourcesModule.id,
  messages: resourcesMessages,
  mockHandlers: resourcesMockHandlers,
} satisfies ModuleServer<typeof resourcesModule.id>;
