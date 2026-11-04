import { z } from "zod";

import { channelSchema } from "@/core/channels";
import { businessDaySchema, endAfterStart, endAfterStartIssue, minuteOfDaySchema } from "@/core/clock";
import { moneySchema } from "@/core/money";
import { pageInput } from "@/core/pagination";

export const bookingStatuses = [
  "pending",
  "awaiting_payment",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
] as const;

/** Who created the booking, as opposed to the medium it came by (`channel`). */
export const bookingOrigins = ["staff", "online", "walk_in", "assistant"] as const;

export const depositStatuses = ["due", "authorized", "captured", "released"] as const;

/** What was booked: a catalog item, how many, how long it takes and what one unit costs. Appointment length is the sum. */
export const bookingLineSchema = z.object({
  catalogItemId: z.string().min(1),
  qty: z.number().int().positive(),
  durationMin: z.number().int().nonnegative().optional(),
  unitPrice: moneySchema,
});

/** Money held against the booking before it happens. `due` means asked for and not yet paid. */
export const depositSchema = z.object({
  amount: moneySchema,
  status: z.enum(depositStatuses),
});

/** A moment on the business clock: the business day and the minute counted from its midnight. */
export const clockReadingSchema = z.object({ day: businessDaySchema, minute: z.number().int().min(0) });

/** The step `bookings.status.advance` last took and when, so `bookings.status.undo` can take it back. */
export const statusStepSchema = z.object({ from: z.enum(bookingStatuses), at: clockReadingSchema });

/**
 * The booking without its cross-field check, so callers can `.omit`, `.pick` and `.partial` it (zod 4 refuses on a
 * refined schema). `contactName` labels a booking without a customer record. Times are minutes from midnight of
 * `businessDay`.
 */
export const bookingObject = z.object({
  id: z.string().min(1),
  status: z.enum(bookingStatuses),
  businessDay: businessDaySchema,
  startMin: minuteOfDaySchema,
  endMin: minuteOfDaySchema,
  resourceIds: z.array(z.string().min(1)),
  staffIds: z.array(z.string().min(1)),
  customerId: z.string().min(1).optional(),
  contactName: z.string().min(1).optional(),
  partySize: z.number().int().min(1).default(1),
  lines: z.array(bookingLineSchema),
  deposit: depositSchema.optional(),
  origin: z.enum(bookingOrigins),
  channel: channelSchema.optional(),
  guestNote: z.string().optional(),
  staffNote: z.string().optional(),
  /** Why staff cancelled it; present only on a cancelled booking. */
  cancelReason: z.string().min(1).optional(),
  /** Why staff marked it a no-show, when they said. */
  noShowReason: z.string().min(1).optional(),
  /** When a write created it; seed bookings have none. A walk-in is undone against this moment. */
  createdAt: clockReadingSchema.optional(),
  /** The last forward step and the status it left; cleared when it is taken back. Cancel and no-show leave none. */
  lastStep: statusStepSchema.optional(),
  tags: z.array(z.string()),
  ext: z.record(z.string(), z.unknown()).optional(),
});

export const bookingSchema = bookingObject.refine(endAfterStart, endAfterStartIssue);

export type BookingStatus = (typeof bookingStatuses)[number];
export type BookingOrigin = (typeof bookingOrigins)[number];
export type DepositStatus = (typeof depositStatuses)[number];
export type BookingLine = z.infer<typeof bookingLineSchema>;
export type Deposit = z.infer<typeof depositSchema>;
export type Booking = z.infer<typeof bookingSchema>;
/** The shape a producer writes: `partySize` may be left out and defaults to 1. */
export type BookingInput = z.input<typeof bookingSchema>;

/** Most guests one booking can hold; a bound for input, not a business rule. */
const MAX_PARTY_SIZE = 200;

const partySizeInput = z.number().int().min(1).max(MAX_PARTY_SIZE);
const noteInput = z.string().trim().max(500);
const tagsInput = z.array(z.string().trim().min(1).max(40)).max(20);
const idInput = z.string().min(1).max(128);

/** Resources a booking occupies; a repeated id would count its seats twice, so it is refused. */
export const resourceIdsInput = z
  .array(idInput)
  .max(10)
  .refine((ids) => new Set(ids).size === ids.length, { message: "resourceIds must not repeat an id" });

export const bookingIdInput = z.strictObject({ id: idInput });

/** Exactly one of `customerId` (a guest on record) or `contactName` (a one-off caller) names who booked. */
export const bookingCreateInput = z
  .strictObject({
    businessDay: businessDaySchema,
    startMin: minuteOfDaySchema,
    partySize: partySizeInput,
    resourceIds: resourceIdsInput.default([]),
    customerId: idInput.optional(),
    contactName: z.string().trim().min(1).max(120).optional(),
    channel: channelSchema,
    guestNote: noteInput.optional(),
    tags: tagsInput.default([]),
  })
  .refine((input) => (input.customerId === undefined) !== (input.contactName === undefined), {
    message: "send exactly one of customerId or contactName",
    path: ["customerId"],
  });

/** An omitted field stays as it is. Moving the start keeps the length of the stay. */
export const bookingRescheduleInput = z.strictObject({
  id: idInput,
  startMin: minuteOfDaySchema.optional(),
  partySize: partySizeInput.optional(),
});

/** The full set of resources the booking holds from now on; an empty list leaves it unassigned. */
export const bookingTableAssignInput = z.strictObject({ id: idInput, resourceIds: resourceIdsInput });

export const bookingStaffNoteAddInput = z.strictObject({ id: idInput, text: noteInput.min(1) });

/** Most bookings one search page returns; the full record of each is long. */
export const BOOKING_SEARCH_MAX_LIMIT = 50;

/**
 * Finds bookings across days: by guest (`customerId`), by an inclusive range of business days and by free text over
 * the name, notes and tags. Every filter is optional; without one it pages through all bookings.
 */
export const bookingSearchInput = pageInput({ defaultLimit: 20, maxLimit: BOOKING_SEARCH_MAX_LIMIT })
  .extend({
    customerId: idInput.optional(),
    from: businessDaySchema.optional(),
    to: businessDaySchema.optional(),
    text: z.string().trim().min(1).max(100).optional(),
  })
  .refine((input) => input.from === undefined || input.to === undefined || input.from <= input.to, {
    message: "from must not be after to",
    path: ["from"],
  });

/** `cancelled` and `no_show` are listed so they fail with a domain error that names the right capability. */
export const bookingStatusAdvanceInput = z.strictObject({ id: idInput, to: z.enum(bookingStatuses) });

export const bookingCancelInput = z.strictObject({ id: idInput, reason: z.string().trim().min(1).max(500) });

export const bookingNoShowInput = z.strictObject({ id: idInput, reason: z.string().trim().min(1).max(500).optional() });

export const walkInSeatInput = z.strictObject({
  partySize: partySizeInput,
  resourceIds: resourceIdsInput.min(1),
  contactName: z.string().trim().min(1).max(120).optional(),
});

export const availabilityInput = z.strictObject({ businessDay: businessDaySchema, partySize: partySizeInput });

/** One start time of the day and the active resources free for a stay beginning there; empty means full. */
export const availabilitySlotSchema = z.object({
  startMin: minuteOfDaySchema,
  endMin: minuteOfDaySchema,
  resourceIds: z.array(z.string().min(1)),
});

export const availabilitySchema = z.object({
  businessDay: businessDaySchema,
  partySize: z.number().int().min(1),
  slots: z.array(availabilitySlotSchema),
});

export const walkInUndoOutput = z.object({ id: z.string().min(1) });

export type Availability = z.infer<typeof availabilitySchema>;
export type ClockReading = z.infer<typeof clockReadingSchema>;
export type StatusStep = z.infer<typeof statusStepSchema>;
export type BookingCreateInput = z.input<typeof bookingCreateInput>;
export type BookingChange = Omit<z.infer<typeof bookingRescheduleInput>, "id"> &
  Partial<Omit<z.infer<typeof bookingTableAssignInput>, "id">>;
