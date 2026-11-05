import "server-only";

import type { ModuleServer } from "@/core/module";

import { notificationsMessages } from "./messages";
import { notificationsMockHandlers } from "./mock";
import { notificationsModule } from "./module";

export * from "./messages";

/** The server half of the notifications module (ADR 0017 §1): its messages and its mock answers. */
export const notificationsModuleServer = {
  id: notificationsModule.id,
  messages: notificationsMessages,
  mockHandlers: notificationsMockHandlers,
} satisfies ModuleServer<typeof notificationsModule.id>;
