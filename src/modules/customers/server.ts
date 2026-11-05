import "server-only";

import type { ModuleServer } from "@/core/module";

import { contactFieldsBundle } from "./contact-fields-messages";
import { loadGuests, searchGuests } from "./guest-slots";
import { customersErrors, customersMessages } from "./messages";
import { customersMockHandlers } from "./mock";
import { customersModule } from "./module";

export * from "./contact-fields-messages";
export * from "./messages";

/** The server half of the customers module (ADR 0017 §1): its messages, its mock answers, the loaders and dictionary of the bookings slots it fills and its error texts. */
export const customersModuleServer = {
  id: customersModule.id,
  messages: customersMessages,
  mockHandlers: customersMockHandlers,
  slotLoaders: { "bookings.guests": loadGuests, "bookings.guest-search": searchGuests },
  slotBundles: { "bookings.contact-fields": contactFieldsBundle },
  errors: customersErrors,
} satisfies ModuleServer<typeof customersModule.id>;
