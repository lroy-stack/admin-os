import { z } from "zod";

/** Until a second preset has assets on bookings, the vehicle on a drop-off lives here. */
export const bookingExtSchema = z.object({ assetId: z.string().min(1) }).strict();

export const assetExtSchema = z
  .object({
    plate: z.string().min(1),
    make: z.string().min(1),
    model: z.string().min(1),
    vin: z.string().length(17).optional(),
    mileageKm: z.number().int().nonnegative().optional(),
  })
  .strict();

/** Labour carries a rate class. A part keeps its stock in `inventory` (ADR 0018 §1) and has no `ext`. */
export const catalogItemExtSchema = z.object({ rateClass: z.string().min(1) }).strict();

export const staffExtSchema = z.object({ certifications: z.array(z.string().min(1)) }).strict();
