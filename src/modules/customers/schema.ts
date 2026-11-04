import { z } from "zod";

import { businessDaySchema, minuteOfDaySchema } from "@/core/clock";
import { moneySchema } from "@/core/money";

/** What the customer agreed to receive. The whole object is absent when consent is unknown. */
export const consentSchema = z.object({ marketing: z.boolean() });

/** Derived counters kept on the record. `spend` and `lastVisit` are null until the first visit or when no source exists. */
export const customerFiguresSchema = z.object({
  visits: z.number().int().nonnegative(),
  spend: moneySchema.nullable(),
  lastVisit: z.iso.datetime({ offset: true }).nullable(),
  noShows: z.number().int().nonnegative(),
});

/** A dated note by the staff member who wrote it. `day` is a business day and `minute` counts from its midnight. */
export const customerNoteSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  authorId: z.string().min(1),
  authorName: z.string().min(1),
  day: businessDaySchema,
  minute: minuteOfDaySchema,
});

export const customerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().min(1).optional(),
  phone: z.e164().optional(),
  locale: z.string().min(1).optional(),
  consent: consentSchema.optional(),
  tags: z.array(z.string()),
  vip: z.boolean(),
  blocked: z.boolean(),
  /** Why the customer is blocked; absent when not blocked. */
  blockReason: z.string().min(1).optional(),
  /** Oldest first. */
  notes: z.array(customerNoteSchema),
  figures: customerFiguresSchema,
  ext: z.record(z.string(), z.unknown()).optional(),
});

/** Something a customer brings to the business and that bookings concern: a vehicle, a pet, a device. */
export const assetSchema = z.object({
  id: z.string().min(1),
  customerId: z.string().min(1),
  kind: z.string().min(1),
  label: z.string().min(1),
  ext: z.record(z.string(), z.unknown()).optional(),
});

export type Customer = z.infer<typeof customerSchema>;
export type CustomerNote = z.infer<typeof customerNoteSchema>;
export type Asset = z.infer<typeof assetSchema>;

/** The fields a person types when adding or editing a contact. Phone is E.164 (`+34600000101`). */
const contactFields = {
  name: z.string().trim().min(1).max(120),
  phone: z.e164(),
  email: z.email(),
  locale: z.string().min(1),
  marketingConsent: z.boolean(),
  tags: z.array(z.string().trim().min(1)).max(20),
};

export const customerCreateInput = z.strictObject({
  name: contactFields.name,
  phone: contactFields.phone.optional(),
  email: contactFields.email.optional(),
  locale: contactFields.locale.optional(),
  marketingConsent: contactFields.marketingConsent.optional(),
  tags: contactFields.tags.default([]),
});

/**
 * Contact data only: name, phone, email and the language they are written to in. An omitted field stays as it is and
 * `null` clears the phone or the email. Consent, VIP and tags are not contact data and have no capability here.
 */
export const customerContactUpdateInput = z.strictObject({
  id: z.string().min(1),
  name: contactFields.name.optional(),
  phone: contactFields.phone.nullable().optional(),
  email: contactFields.email.nullable().optional(),
  locale: contactFields.locale.optional(),
});

export type CustomerCreateInput = z.input<typeof customerCreateInput>;
export type CustomerContactUpdateInput = z.infer<typeof customerContactUpdateInput>;
