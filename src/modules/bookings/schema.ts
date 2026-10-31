import { z } from "zod";

import { channelSchema } from "@/core/channels";
import { businessDaySchema, endAfterStart, endAfterStartIssue, minuteOfDaySchema } from "@/core/clock";
import { moneySchema } from "@/core/money";

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
