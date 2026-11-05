import "server-only";

import type { ModuleServer } from "@/core/module";

import { partiesMessages } from "./messages";
import { partiesMockHandlers } from "./mock";
import { partiesModule } from "./module";

export * from "./messages";

/** The server half of the parties module (ADR 0017 §1): its messages and its mock answers. */
export const partiesModuleServer = {
  id: partiesModule.id,
  messages: partiesMessages,
  mockHandlers: partiesMockHandlers,
} satisfies ModuleServer<typeof partiesModule.id>;
