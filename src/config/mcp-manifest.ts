import type { ToolManifest } from "@/core/mcp/server";

import type { CatalogById } from "./catalog";

/**
 * The MCP manifest of the kit (spec 004 D5): every capability is either a tool, with the title clients show, or
 * UI-only, with the reason. A new capability does not compile until it is classified here. Inputs, outputs and
 * effects stay the capability's own; `ids` names, per id field, the tools that list valid values (spec 004 U3).
 */
export const MCP_MANIFEST = {
  "access.me.get": { expose: true, title: "Who am I" },
  "clock.get": { expose: true, title: "Business clock" },
  "settings.values.get": { expose: true, title: "Read settings" },
  "bookings.list": { expose: true, title: "List the day's bookings" },
  "bookings.availability.get": { expose: true, title: "Find free times and resources" },
  "bookings.create": {
    expose: true,
    title: "Create a booking",
    ids: {
      customerId: ["customers.list", "customers.duplicates.check"],
      resourceIds: ["bookings.availability.get", "resources.list"],
    },
  },
  "bookings.update": { expose: true, title: "Change a booking", ids: { id: ["bookings.list"] } },
  "bookings.status.advance": { expose: true, title: "Advance a booking's status", ids: { id: ["bookings.list"] } },
  "bookings.status.undo": {
    uiOnly:
      "The undo affordance of the person who just advanced a status; agents use the forward capabilities (ADR 0016, resolution 3)",
  },
  "bookings.cancel": { expose: true, title: "Cancel a booking", ids: { id: ["bookings.list"] } },
  "bookings.no_show.mark": { expose: true, title: "Mark a no-show", ids: { id: ["bookings.list"] } },
  "bookings.walk_in.seat": {
    expose: true,
    title: "Seat a walk-in",
    ids: { resourceIds: ["bookings.availability.get", "resources.list"] },
  },
  "bookings.walk_in.undo": {
    uiOnly:
      "The undo affordance of the person who just seated a walk-in; agents use the forward capabilities (ADR 0016, resolution 3)",
  },
  "catalog.list": { expose: true, title: "List catalog items" },
  "customers.list": { expose: true, title: "List customers" },
  "customers.get": {
    expose: true,
    title: "Get a customer",
    ids: { id: ["customers.list", "customers.duplicates.check"] },
  },
  "customers.duplicates.check": { expose: true, title: "Check for duplicate customers" },
  "customers.create": { expose: true, title: "Create a customer" },
  "customers.update": {
    expose: true,
    title: "Change a customer",
    ids: { id: ["customers.list", "customers.duplicates.check"] },
  },
  "customers.notes.add": {
    expose: true,
    title: "Add a customer note",
    ids: { id: ["customers.list", "customers.duplicates.check"] },
  },
  "customers.block": {
    expose: true,
    title: "Block a customer",
    ids: { id: ["customers.list", "customers.duplicates.check"] },
  },
  "customers.unblock": {
    expose: true,
    title: "Unblock a customer",
    ids: { id: ["customers.list", "customers.duplicates.check"] },
  },
  "notifications.list": { expose: true, title: "List notifications" },
  "notifications.unread.count": { expose: true, title: "Count unread notifications" },
  "notifications.read": { expose: true, title: "Mark notifications read", ids: { ids: ["notifications.list"] } },
  "notifications.read_all": { expose: true, title: "Mark all notifications read" },
  "resources.list": { expose: true, title: "List resources" },
  "staff.list": { expose: true, title: "List staff" },
} as const satisfies ToolManifest<CatalogById>;
