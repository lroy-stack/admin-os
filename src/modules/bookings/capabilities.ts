import { defineCapability } from "@/core/capability";
import { businessDaySchema } from "@/core/clock";
import { pageInput, pageOutput } from "@/core/pagination";

import {
  availabilityInput,
  availabilitySchema,
  bookingCancelInput,
  bookingCreateInput,
  bookingIdInput,
  bookingNoShowInput,
  bookingRescheduleInput,
  bookingSchema,
  bookingSearchInput,
  bookingStaffNoteAddInput,
  bookingStatusAdvanceInput,
  bookingSummarySchema,
  bookingTableAssignInput,
  walkInSeatInput,
  walkInUndoOutput,
} from "./schema";

export const bookingsList = defineCapability({
  id: "bookings.list",
  summary:
    "List the bookings of one business day, one page at a time. Without businessDay it lists the current business day.",
  input: pageInput({ defaultLimit: 50, maxLimit: 200 }).extend({ businessDay: businessDaySchema.optional() }),
  output: pageOutput(bookingSchema),
  permission: "read:bookings",
  effect: "read",
  riskTier: 1,
});

export const bookingsGet = defineCapability({
  id: "bookings.get",
  summary: "Get one booking by id. Fails with bookings.not_found when there is none.",
  input: bookingIdInput,
  output: bookingSchema,
  permission: "read:bookings",
  effect: "read",
  riskTier: 1,
});

export const bookingsSearch = defineCapability({
  id: "bookings.search",
  summary:
    "Find bookings across days, one page of at most 50 at a time, by customerId, by an inclusive range of business days (from, to) and by text matched against the booking id, the guest's name and tags (never notes, which bookings.get returns). Rows are concise: id, day, start, party size, status, customer, name, resources and tags. Filters combine; results are ordered by day and start. Use bookings.list for one day.",
  input: bookingSearchInput,
  output: pageOutput(bookingSummarySchema),
  permission: "read:bookings",
  effect: "read",
  riskTier: 1,
});

export const bookingsAvailabilityGet = defineCapability({
  id: "bookings.availability.get",
  summary:
    "The start times of a business day's service window that are still ahead of the clock (none on an earlier day), on the slot grid, each with the active resources that are free for a stay beginning there and seat the whole party on their own. An empty list means that time is full.",
  input: availabilityInput,
  output: availabilitySchema,
  permission: "read:bookings",
  effect: "read",
  riskTier: 0,
});

export const bookingsCreate = defineCapability({
  id: "bookings.create",
  summary:
    "Create a confirmed booking. Send exactly one of customerId (a guest on record; create one with customers.create first) or contactName. The start must be on the slot grid inside the service window and not before the clock (clock.get). Resources are optional; when given they must be active, free for the stay and seat the party together. Fails with bookings.not_enough_seats, bookings.resource_busy, bookings.resource_inactive, bookings.outside_window, bookings.off_grid, bookings.start_passed or bookings.not_found.",
  input: bookingCreateInput,
  output: bookingSchema,
  permission: "create:bookings",
  effect: "write",
  riskTier: 2,
  change: "add",
  idempotency: "key",
  requiresIdempotencyKey: true,
});

export const bookingsReschedule = defineCapability({
  id: "bookings.reschedule",
  summary:
    "Move an open booking in time and optionally onto other tables in the same step: send startMin, partySize and/or resourceIds (at least one); omitted fields stay as they are and moving the start keeps the length of the stay. The new time and tables are checked together, so use it when both change; bookings.table.assign changes only the tables. Same rules as bookings.create; fails with bookings.closed for a completed, cancelled or no-show booking, and with bookings.not_enough_seats, bookings.resource_busy, bookings.resource_inactive, bookings.outside_window, bookings.off_grid, bookings.start_passed or bookings.not_found.",
  input: bookingRescheduleInput,
  output: bookingSchema,
  permission: "update:bookings",
  effect: "write",
  riskTier: 2,
  change: "overwrite",
  idempotency: "target-state",
});

export const bookingsTableAssign = defineCapability({
  id: "bookings.table.assign",
  summary:
    "Set the resources (tables, chairs or bays) an open booking holds, replacing the ones it has, and change nothing else; an empty list leaves it unassigned. To change the time as well, use bookings.reschedule. They must be active, free for the stay and seat the party together. Fails with bookings.closed, bookings.not_enough_seats, bookings.resource_busy, bookings.resource_inactive or bookings.not_found.",
  input: bookingTableAssignInput,
  output: bookingSchema,
  permission: "update:bookings",
  effect: "write",
  riskTier: 2,
  change: "overwrite",
  idempotency: "target-state",
});

export const bookingsStaffNoteAdd = defineCapability({
  id: "bookings.staff_note.add",
  summary:
    "Add a line to the staff note of an open booking, after what is already there. The guest's own note is not changed. Notes are capped at 2000 characters in all: fails with bookings.staff_note_full when the line does not fit, with bookings.closed for a completed, cancelled or no-show booking and bookings.not_found for an unknown id.",
  input: bookingStaffNoteAddInput,
  output: bookingSchema,
  permission: "update:bookings",
  effect: "write",
  riskTier: 2,
  change: "add",
  idempotency: "key",
  requiresIdempotencyKey: true,
});

export const bookingsStatusAdvance = defineCapability({
  id: "bookings.status.advance",
  summary:
    "Move a booking one step forward: pending or awaiting_payment to confirmed, confirmed to in_progress, in_progress to completed. Cancelling and no-shows have their own capabilities. Repeating a step on a booking already in that status answers it unchanged. Any other move fails with bookings.invalid_transition.",
  input: bookingStatusAdvanceInput,
  output: bookingSchema,
  permission: "update:bookings",
  effect: "write",
  riskTier: 2,
  change: "set",
  idempotency: "target-state",
});

export const bookingsStatusUndo = defineCapability({
  id: "bookings.status.undo",
  summary:
    "Take back the last forward step of bookings.status.advance, returning the booking to the status it left (for example in_progress back to confirmed). Only within bookings.walk_in.undo_seconds of that step; otherwise it fails with bookings.status_undo_expired. Fails with bookings.invalid_transition when the booking has no step to take back, or has moved on since (cancelled, no-show, advanced again by another route).",
  input: bookingIdInput,
  output: bookingSchema,
  permission: "update:bookings",
  effect: "write",
  riskTier: 2,
  change: "set",
  idempotency: "key",
  requiresIdempotencyKey: true,
});

export const bookingsCancel = defineCapability({
  id: "bookings.cancel",
  summary:
    "Cancel a pending, awaiting_payment or confirmed booking with the reason staff will see, and release its resources. Cancelling a booking that is already cancelled answers it unchanged and keeps the first reason. Fails with bookings.invalid_transition otherwise.",
  input: bookingCancelInput,
  output: bookingSchema,
  permission: "cancel:bookings",
  effect: "destructive",
  riskTier: 2,
  change: "set",
  idempotency: "target-state",
});

export const bookingsNoShowMark = defineCapability({
  id: "bookings.no_show.mark",
  summary:
    "Mark a confirmed booking as a no-show once it counts as late (bookings.late_after_minutes after its start), and release its resources. Marking a booking that is already a no-show answers it unchanged. Fails with bookings.too_early before that and bookings.invalid_transition from any other status.",
  input: bookingNoShowInput,
  output: bookingSchema,
  permission: "noshow:bookings",
  effect: "destructive",
  riskTier: 2,
  change: "set",
  idempotency: "target-state",
});

export const bookingsWalkInSeat = defineCapability({
  id: "bookings.walk_in.seat",
  summary:
    "Seat a party that arrived without a booking, now, on the given resources, for the walk-in stay (bookings.walk_in.stay_minutes). Creates an in_progress booking with origin walk_in on the current business day. Fails with bookings.not_enough_seats, bookings.resource_busy, bookings.resource_inactive or bookings.not_found.",
  input: walkInSeatInput,
  output: bookingSchema,
  permission: "create:bookings",
  effect: "write",
  riskTier: 2,
  change: "add",
  idempotency: "key",
  requiresIdempotencyKey: true,
});

export const bookingsWalkInUndo = defineCapability({
  id: "bookings.walk_in.undo",
  summary:
    "Take back a walk-in that was just seated, as if it never happened. Only for a walk-in still in progress and only within bookings.walk_in.undo_seconds of seating; otherwise it fails with bookings.undo_expired.",
  input: bookingIdInput,
  output: walkInUndoOutput,
  permission: "update:bookings",
  effect: "write",
  riskTier: 2,
  change: "remove",
  idempotency: "key",
  requiresIdempotencyKey: true,
});

export const bookingsCapabilities = {
  "bookings.list": bookingsList,
  "bookings.get": bookingsGet,
  "bookings.search": bookingsSearch,
  "bookings.availability.get": bookingsAvailabilityGet,
  "bookings.create": bookingsCreate,
  "bookings.reschedule": bookingsReschedule,
  "bookings.table.assign": bookingsTableAssign,
  "bookings.staff_note.add": bookingsStaffNoteAdd,
  "bookings.status.advance": bookingsStatusAdvance,
  "bookings.status.undo": bookingsStatusUndo,
  "bookings.cancel": bookingsCancel,
  "bookings.no_show.mark": bookingsNoShowMark,
  "bookings.walk_in.seat": bookingsWalkInSeat,
  "bookings.walk_in.undo": bookingsWalkInUndo,
} as const;
