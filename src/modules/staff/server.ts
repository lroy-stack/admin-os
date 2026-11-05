import "server-only";

import type { ModuleServer } from "@/core/module";

import { staffMessages } from "./messages";
import { staffMockHandlers } from "./mock";
import { staffModule } from "./module";

/** The server half of the staff module (ADR 0017 §1): its messages and its mock answers. */
export const staffModuleServer = {
  id: staffModule.id,
  messages: staffMessages,
  mockHandlers: staffMockHandlers,
} satisfies ModuleServer<typeof staffModule.id>;
