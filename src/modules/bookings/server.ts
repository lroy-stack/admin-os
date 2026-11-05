import "server-only";

import type { ModuleServer } from "@/core/module";

import { bookingsApprovals, bookingsMessages } from "./messages";
import { bookingsMockHandlers } from "./mock";
import { bookingsModule } from "./module";

export * from "./messages";

/** The server half of the bookings module (ADR 0017 §1): its messages, mock answers and bell sentences for held writes. */
export const bookingsModuleServer = {
  id: bookingsModule.id,
  messages: bookingsMessages,
  mockHandlers: bookingsMockHandlers,
  approvals: bookingsApprovals,
} satisfies ModuleServer<typeof bookingsModule.id>;
