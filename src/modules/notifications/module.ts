import { defineModule } from "@/core/module";

import { notificationsCapabilities } from "./capabilities";
import { notificationsSettings } from "./settings";

/** The notifications module's manifest (ADR 0017 §1). Notifications are derived, so the module seeds nothing. */
export const notificationsModule = defineModule({
  id: "notifications",
  capabilities: notificationsCapabilities,
  settings: notificationsSettings,
  mcp: {
    tools: {
      "notifications.list": { expose: true, title: "List notifications" },
      "notifications.unread.count": { expose: true, title: "Count unread notifications" },
      "notifications.read": { expose: true, title: "Mark notifications read", ids: { ids: ["notifications.list"] } },
      "notifications.read_all": { expose: true, title: "Mark all notifications read" },
    },
  },
  seed: {},
  // A derived item names the customer of the booking it comes from, so the field is read from bookings' rows and
  // repeats bookings' own reference on purpose; notifications requires bookings (ADR 0017 §2).
  references: [{ collection: "bookings", field: "customerId", module: "customers", required: false }],
  owns: ["src/config/notifications.test.ts", "e2e/smoke/notifications.spec.ts"],
});
