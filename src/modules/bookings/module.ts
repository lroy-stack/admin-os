import { defineModule } from "@/core/module";
import { pageOutput } from "@/core/pagination";

import { bookingsCapabilities } from "./capabilities";
import { bookingObject, bookingSchema } from "./schema";
import { bookingsSettings } from "./settings";

const BOOKING_IDS = ["bookings.list", "bookings.search"] as const;
/** Tools of the customers module, named without importing it (ADR 0017 §1). */
const CUSTOMER_IDS = ["customers.search", "customers.duplicates.check"] as const;
const RESOURCE_IDS = ["bookings.availability.get", "resources.list"] as const;

/**
 * A booking's free text: the guest's and the staff's notes, why it was cancelled or missed, and the name typed for a
 * walk-in or a booking without a customer record. Tags stay plain values.
 */
const BOOKING_TEXT = ["guestNote", "staffNote", "cancelReason", "noShowReason", "contactName"] as const;

/** A day's booking as a list shows it: no notes and no `ext`; the reasons stay, marked, since they say why it ended. */
const bookingRow = bookingObject.omit({ guestNote: true, staffNote: true, ext: true });

/** The bookings module's manifest (ADR 0017 §1). */
export const bookingsModule = defineModule({
  id: "bookings",
  capabilities: bookingsCapabilities,
  settings: bookingsSettings,
  mcp: {
    noun: "bookings",
    idSources: [
      ["booking ids", ["bookings.list"]],
      ["resource ids", ["bookings.availability.get"]],
    ],
    tools: {
      "bookings.list": {
        expose: true,
        title: "List the day's bookings",
        concise: pageOutput(bookingRow),
        untrusted: ["items[].cancelReason", "items[].noShowReason", "items[].contactName"],
      },
      "bookings.get": { expose: true, title: "Get a booking", ids: { id: BOOKING_IDS }, untrusted: BOOKING_TEXT },
      "bookings.search": {
        expose: true,
        title: "Search bookings",
        ids: { customerId: CUSTOMER_IDS },
        untrusted: ["items[].contactName"],
      },
      "bookings.availability.get": { expose: true, title: "Find free times and resources" },
      "bookings.create": {
        expose: true,
        title: "Create a booking",
        ids: { customerId: CUSTOMER_IDS, resourceIds: RESOURCE_IDS },
        untrusted: BOOKING_TEXT,
      },
      "bookings.reschedule": {
        expose: true,
        title: "Reschedule a booking",
        ids: { id: BOOKING_IDS },
        untrusted: BOOKING_TEXT,
      },
      "bookings.table.assign": {
        expose: true,
        title: "Assign tables to a booking",
        ids: { id: BOOKING_IDS, resourceIds: RESOURCE_IDS },
        untrusted: BOOKING_TEXT,
      },
      "bookings.staff_note.add": {
        expose: true,
        title: "Add a staff note to a booking",
        ids: { id: BOOKING_IDS },
        untrusted: BOOKING_TEXT,
      },
      "bookings.status.advance": {
        expose: true,
        title: "Advance a booking's status",
        ids: { id: BOOKING_IDS },
        untrusted: BOOKING_TEXT,
      },
      "bookings.status.undo": {
        uiOnly:
          "The undo affordance of the person who just advanced a status; agents use the forward capabilities (ADR 0016, resolution 3)",
      },
      "bookings.cancel": { expose: true, title: "Cancel a booking", ids: { id: BOOKING_IDS }, untrusted: BOOKING_TEXT },
      "bookings.no_show.mark": {
        expose: true,
        title: "Mark a no-show",
        ids: { id: BOOKING_IDS },
        untrusted: BOOKING_TEXT,
      },
      "bookings.walk_in.seat": {
        expose: true,
        title: "Seat a walk-in",
        ids: { resourceIds: RESOURCE_IDS },
        untrusted: BOOKING_TEXT,
      },
      "bookings.walk_in.undo": {
        uiOnly:
          "The undo affordance of the person who just seated a walk-in; agents use the forward capabilities (ADR 0016, resolution 3)",
      },
    },
  },
  seed: {
    bookings: { schema: bookingSchema, required: true, ext: { entity: "booking", optional: true } },
  },
  references: [
    { collection: "bookings", field: "lines[].catalogItemId", module: "catalog", required: false },
    { collection: "bookings", field: "customerId", module: "customers", required: false },
    { collection: "bookings", field: "staffIds[]", module: "staff", required: false },
    // Required: the bookings route lists the resources for the floor plan (ADR 0017 §2).
    { collection: "bookings", field: "resourceIds[]", module: "resources", required: true },
  ],
  owns: [
    "src/app/(main)/dashboard/bookings",
    "src/config/bookings.test.ts",
    "e2e/smoke/bookings.spec.ts",
    "e2e/smoke/bookings-day.spec.ts",
    "e2e/smoke/bookings-new-reservation.spec.ts",
    "e2e/smoke/bookings-walk-in.spec.ts",
    "e2e/smoke/bookings-writes.spec.ts",
    "e2e/smoke/panel.spec.ts",
    "e2e/workers/cross-door.spec.ts",
  ],
});
