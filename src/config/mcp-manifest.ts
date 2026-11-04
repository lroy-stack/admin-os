import type { ToolManifest } from "@/core/mcp/server";

import type { CatalogById } from "./catalog";

/**
 * The MCP manifest of the kit (spec 004 D5): every capability is either a tool, with the title clients show, or
 * UI-only, with the reason. A new capability does not compile until it is classified here. Inputs, outputs and
 * effects stay the capability's own.
 */
export const MCP_MANIFEST = {
  "access.me.get": { expose: true, title: "Who am I" },
  "clock.get": { expose: true, title: "Business clock" },
  "settings.values.get": { expose: true, title: "Read settings" },
  "bookings.list": { expose: true, title: "List the day's bookings" },
  "bookings.availability.get": { expose: true, title: "Find free times and resources" },
  "bookings.create": { expose: true, title: "Create a booking" },
  "bookings.update": { expose: true, title: "Change a booking" },
  "bookings.status.advance": { expose: true, title: "Advance a booking's status" },
  "bookings.status.undo": { expose: true, title: "Undo a status step" },
  "bookings.cancel": { expose: true, title: "Cancel a booking" },
  "bookings.no_show.mark": { expose: true, title: "Mark a no-show" },
  "bookings.walk_in.seat": { expose: true, title: "Seat a walk-in" },
  "bookings.walk_in.undo": { expose: true, title: "Undo a walk-in" },
  "catalog.list": { expose: true, title: "List catalog items" },
  "customers.list": { expose: true, title: "List customers" },
  "customers.get": { expose: true, title: "Get a customer" },
  "customers.duplicates.check": { expose: true, title: "Check for duplicate customers" },
  "customers.create": { expose: true, title: "Create a customer" },
  "customers.update": { expose: true, title: "Change a customer" },
  "customers.notes.add": { expose: true, title: "Add a customer note" },
  "customers.block": { expose: true, title: "Block a customer" },
  "customers.unblock": { expose: true, title: "Unblock a customer" },
  "notifications.list": { expose: true, title: "List notifications" },
  "notifications.unread.count": { expose: true, title: "Count unread notifications" },
  "notifications.read": { expose: true, title: "Mark notifications read" },
  "notifications.read_all": { expose: true, title: "Mark all notifications read" },
  "resources.list": { expose: true, title: "List resources" },
  "staff.list": { expose: true, title: "List staff" },
} as const satisfies ToolManifest<CatalogById>;
