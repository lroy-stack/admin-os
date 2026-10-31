import { z } from "zod";

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

export const customerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  locale: z.string().min(1).optional(),
  consent: consentSchema.optional(),
  tags: z.array(z.string()),
  vip: z.boolean(),
  blocked: z.boolean(),
  notes: z.string().optional(),
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
export type Asset = z.infer<typeof assetSchema>;
