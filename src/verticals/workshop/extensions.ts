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

/** Parts carry stock data; labour carries a rate class. Exactly one of the two groups is set per item. */
export const catalogItemExtSchema = z.union([
  z.object({ sku: z.string().min(1), stock: z.number().int().nonnegative(), supplier: z.string().min(1) }).strict(),
  z.object({ rateClass: z.string().min(1) }).strict(),
]);

export const staffExtSchema = z.object({ certifications: z.array(z.string().min(1)) }).strict();
