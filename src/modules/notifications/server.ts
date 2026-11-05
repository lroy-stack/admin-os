import "server-only";

import type { ModuleServer } from "@/core/module";

import { notificationsFeed } from "./feed";
import { notificationsMessages } from "./messages";
import { notificationsMockHandlers } from "./mock";
import { notificationsModule } from "./module";

export * from "./messages";

/** The server half of the notifications module (ADR 0017 §1): its messages, its mock answers and the words of its bell feed. */
export const notificationsModuleServer = {
  id: notificationsModule.id,
  messages: notificationsMessages,
  mockHandlers: notificationsMockHandlers,
  feeds: { notifications: notificationsFeed },
} satisfies ModuleServer<typeof notificationsModule.id>;
