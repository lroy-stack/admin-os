import "server-only";

import type { ModuleServer } from "@/core/module";

import { bookingsMessages } from "./messages";
import { bookingsMockHandlers } from "./mock";
import { bookingsModule } from "./module";

export * from "./messages";

/** The server half of the bookings module (ADR 0017 §1): its messages and its mock answers. */
export const bookingsModuleServer = {
  id: bookingsModule.id,
  messages: bookingsMessages,
  mockHandlers: bookingsMockHandlers,
} satisfies ModuleServer<typeof bookingsModule.id>;
