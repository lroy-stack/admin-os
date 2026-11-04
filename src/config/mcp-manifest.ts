import { z } from "zod";

import type { ToolManifest } from "@/core/mcp/server";
import { pageOutput } from "@/core/pagination";
import { bookingObject } from "@/modules/bookings";
import { customerSummarySchema, duplicateMatchSchema } from "@/modules/customers";
import { staffMemberSchema } from "@/modules/staff";

import type { CatalogById } from "./catalog";

/**
 * The MCP manifest of the kit (spec 004 D5): every capability is either a tool, with the title clients show, or
 * UI-only, with the reason. A new capability does not compile until it is classified here. Inputs, outputs and
 * effects stay the capability's own; `ids` names, per id field, the tools that list valid values (spec 004 U3).
 *
 * Least data (spec 004 principle 7, AC8): a list tool returns `concise` rows, without the free text and the personal
 * data an agent does not need to pick a record; the full record stays one `get` away. The web app reads the
 * capability's own output, which is not changed. Free text that people or other agents wrote is `untrusted`: returned
 * as `{ untrusted: true, text }` wherever a tool returns it (ADR 0016, "Untrusted free text").
 * Names, tags and contact data of a record stay plain values, since an agent needs them to search and book, and the
 * server instructions tell it to treat every string as data; `contactName` is free text typed for a booking, so it
 * is marked. Notifications, resources, the catalogue and approvals carry no notes or contact data, so they stay as
 * they are.
 */
const BOOKING_IDS = ["bookings.list", "bookings.search"] as const;
const CUSTOMER_IDS = ["customers.search", "customers.duplicates.check"] as const;

/**
 * A booking's free text: the guest's and the staff's notes, why it was cancelled or missed, and the name typed for a
 * walk-in or a booking without a customer record. Tags stay plain values.
 */
const BOOKING_TEXT = ["guestNote", "staffNote", "cancelReason", "noShowReason", "contactName"] as const;
/** A customer's free text: the staff's dated notes, and why the customer is blocked. */
const CUSTOMER_TEXT = ["notes[].text", "blockReason"] as const;

/** A day's booking as a list shows it: no notes and no `ext`; the reasons stay, marked, since they say why it ended. */
const bookingRow = bookingObject.omit({ guestNote: true, staffNote: true, ext: true });
/** A possible duplicate as the check shows it: enough to recognise the person, not their notes or consent. */
const duplicateRow = z.object({ matches: z.array(duplicateMatchSchema.extend({ customer: customerSummarySchema })) });
/** A staff member as a list shows them: no contract terms and no `ext`. */
const staffRow = staffMemberSchema.omit({ contract: true, ext: true });

export const MCP_MANIFEST = {
  "access.me.get": { expose: true, title: "Who am I" },
  "approvals.get": { expose: true, title: "Check a held write" },
  "approvals.list": {
    uiOnly:
      "The queue a person decides from; it returns the held input, which an assistant has no need to read (spec 004, D7)",
  },
  "approvals.approve": {
    uiOnly: "Approving is the human step the policy exists for; an assistant must never approve its own write (D7)",
  },
  "approvals.reject": {
    uiOnly: "Rejecting is a person's decision, taken in the web app (D7)",
  },
  "approvals.policy.set": {
    uiOnly: "The owner's control over what assistants may do without asking; elevated and never an MCP tool (D7)",
  },
  "clock.get": { expose: true, title: "Business clock" },
  "settings.values.get": { expose: true, title: "Read settings" },
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
    ids: {
      customerId: CUSTOMER_IDS,
      resourceIds: ["bookings.availability.get", "resources.list"],
    },
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
    ids: { id: BOOKING_IDS, resourceIds: ["bookings.availability.get", "resources.list"] },
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
  "bookings.no_show.mark": { expose: true, title: "Mark a no-show", ids: { id: BOOKING_IDS }, untrusted: BOOKING_TEXT },
  "bookings.walk_in.seat": {
    expose: true,
    title: "Seat a walk-in",
    ids: { resourceIds: ["bookings.availability.get", "resources.list"] },
    untrusted: BOOKING_TEXT,
  },
  "bookings.walk_in.undo": {
    uiOnly:
      "The undo affordance of the person who just seated a walk-in; agents use the forward capabilities (ADR 0016, resolution 3)",
  },
  "catalog.list": { expose: true, title: "List catalog items" },
  "customers.list": { expose: true, title: "List customers", concise: pageOutput(customerSummarySchema) },
  "customers.search": { expose: true, title: "Search customers" },
  "customers.get": {
    expose: true,
    title: "Get a customer",
    ids: { id: CUSTOMER_IDS },
    untrusted: CUSTOMER_TEXT,
  },
  "customers.duplicates.check": { expose: true, title: "Check for duplicate customers", concise: duplicateRow },
  "customers.create": { expose: true, title: "Create a customer", untrusted: CUSTOMER_TEXT },
  "customers.contact.update": {
    expose: true,
    title: "Change a customer's contact details",
    ids: { id: CUSTOMER_IDS },
    untrusted: CUSTOMER_TEXT,
  },
  "customers.notes.add": {
    expose: true,
    title: "Add a customer note",
    ids: { id: CUSTOMER_IDS },
    untrusted: CUSTOMER_TEXT,
  },
  "customers.block": {
    expose: true,
    title: "Block a customer",
    ids: { id: CUSTOMER_IDS },
    untrusted: CUSTOMER_TEXT,
  },
  "customers.unblock": {
    expose: true,
    title: "Unblock a customer",
    ids: { id: CUSTOMER_IDS },
    untrusted: CUSTOMER_TEXT,
  },
  "notifications.list": { expose: true, title: "List notifications" },
  "notifications.unread.count": { expose: true, title: "Count unread notifications" },
  "notifications.read": { expose: true, title: "Mark notifications read", ids: { ids: ["notifications.list"] } },
  "notifications.read_all": { expose: true, title: "Mark all notifications read" },
  "resources.list": { expose: true, title: "List resources" },
  "staff.list": { expose: true, title: "List staff", concise: pageOutput(staffRow) },
} as const satisfies ToolManifest<CatalogById>;
