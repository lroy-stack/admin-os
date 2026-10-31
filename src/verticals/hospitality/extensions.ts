import { z } from "zod";

/** EU-14 allergens: a closed list because it is food safety, not a free tag. */
export const allergenSchema = z.enum([
  "gluten",
  "crustaceans",
  "eggs",
  "fish",
  "peanuts",
  "soy",
  "milk",
  "nuts",
  "celery",
  "mustard",
  "sesame",
  "sulphites",
  "lupin",
  "molluscs",
]);

/**
 * Booking extras. `type` is set only for events and large groups: a walk-in is already `origin: "walk_in"`.
 * `arrivalMin` is when the party arrives, which for an event can differ from the booked window.
 */
export const bookingExtSchema = z
  .object({
    type: z.enum(["standard", "walkin", "event"]).optional(),
    occasion: z.string().min(1).optional(),
    blockedSeats: z.record(z.string().min(1), z.array(z.number().int().nonnegative())).optional(),
    adults: z.number().int().nonnegative().optional(),
    children: z.number().int().nonnegative().optional(),
    dietaryNote: z.string().min(1).optional(),
    arrivalMin: z.number().int().min(0).max(1440).optional(),
  })
  .strict();

export const customerExtSchema = z
  .object({
    allergens: z.array(allergenSchema),
    dietaryRestrictions: z.array(z.string()),
    vipNote: z.string().min(1).optional(),
    preferredTime: z.string().min(1).optional(),
    birthday: z
      .string()
      .regex(/^\d{2}-\d{2}$/)
      .optional(),
    anniversary: z
      .string()
      .regex(/^\d{2}-\d{2}$/)
      .optional(),
    membershipId: z.string().min(1).optional(),
    blockReason: z.string().optional(),
    blockedUntil: z.iso.datetime({ offset: true }).optional(),
  })
  .strict();

export const catalogItemExtSchema = z
  .object({
    allergens: z.array(allergenSchema),
    pairing: z.string().min(1).optional(),
    dishOfTheDay: z.boolean().optional(),
  })
  .strict();

export const resourceExtSchema = z.object({ shape: z.enum(["rect", "square", "round", "bar"]) }).strict();

export const areaExtSchema = z.object({ outdoor: z.boolean() }).strict();

export const staffExtSchema = z.object({ crew: z.enum(["floor", "kitchen"]) }).strict();
