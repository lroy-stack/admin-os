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
  "bookings.status.undo": {
    uiOnly:
      "The undo affordance of the person who just advanced a status; agents use the forward capabilities (ADR 0016, resolution 3)",
  },
  "bookings.cancel": { expose: true, title: "Cancel a booking" },
  "bookings.no_show.mark": { expose: true, title: "Mark a no-show" },
  "bookings.walk_in.seat": { expose: true, title: "Seat a walk-in" },
  "bookings.walk_in.undo": {
    uiOnly:
      "The undo affordance of the person who just seated a walk-in; agents use the forward capabilities (ADR 0016, resolution 3)",
  },
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

const FIND_IDS =
  "admin-OS runs one small business: bookings, customers, resources (tables, chairs or bays), staff, catalog items and notifications. Never guess an id: find booking ids with bookings_list, customer ids with customers_list or customers_duplicates_check, resource ids with resources_list or bookings_availability_get, and notification ids with notifications_list; clock_get gives today's business day.";

const WRITES =
  "Create and add tools require an idempotencyKey argument: a new UUID for each operation, the same one when you retry it. A write may answer awaiting_approval: a person must approve it first, so do not retry it. An error names the field to fix and the tool that finds a valid value.";

const READ_ONLY = "This server is read-only: it lists and runs read tools only.";

/** The server's `instructions` (spec 004 U2): where ids come from and what a held write means. */
export const mcpInstructions = (readOnly: boolean): string => `${FIND_IDS} ${readOnly ? READ_ONLY : WRITES}`;
