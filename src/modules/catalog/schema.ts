import { z } from "zod";

import { localizedTextSchema } from "@/core/i18n";
import { moneySchema } from "@/core/money";

export const catalogItemKinds = ["product", "service", "bundle"] as const;
export const catalogItemStatuses = ["active", "inactive", "archived"] as const;

/** A named group of item references inside a bundle: the courses of a menu, the steps of a pack. */
export const bundleSectionSchema = z.object({
  id: z.string().min(1),
  name: localizedTextSchema,
  itemIds: z.array(z.string().min(1)),
});

export const catalogItemSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(catalogItemKinds),
  name: localizedTextSchema,
  categoryId: z.string().min(1),
  price: moneySchema,
  durationMin: z.number().int().positive().optional(),
  status: z.enum(catalogItemStatuses),
  media: z.array(z.object({ url: z.string().min(1), alt: z.string().optional() })),
  tags: z.array(z.string()),
  sections: z.array(bundleSectionSchema).optional(),
  ext: z.record(z.string(), z.unknown()).optional(),
});

export type BundleSection = z.infer<typeof bundleSectionSchema>;
export type CatalogItem = z.infer<typeof catalogItemSchema>;
