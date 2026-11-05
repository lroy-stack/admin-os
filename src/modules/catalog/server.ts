import "server-only";

import type { ModuleServer } from "@/core/module";

import { catalogMessages } from "./messages";
import { catalogMockHandlers } from "./mock";
import { catalogModule } from "./module";

/** The server half of the catalog module (ADR 0017 §1): its messages and its mock answers. */
export const catalogModuleServer = {
  id: catalogModule.id,
  messages: catalogMessages,
  mockHandlers: catalogMockHandlers,
} satisfies ModuleServer<typeof catalogModule.id>;
