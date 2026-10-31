import { z } from "zod";

/** A place that groups resources. `levelId` stacks areas vertically (floors, decks) without a separate level entity. */
export const areaSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  levelId: z.string().min(1).optional(),
  ext: z.record(z.string(), z.unknown()).optional(),
});

/** Anything a booking occupies. `kind` is the preset's vocabulary (table, chair, bay), so it is free text here. */
export const resourceSchema = z.object({
  id: z.string().min(1),
  kind: z.string().min(1),
  label: z.string().min(1),
  areaId: z.string().min(1),
  capacity: z.number().int().positive().optional(),
  active: z.boolean(),
  ext: z.record(z.string(), z.unknown()).optional(),
});

export type Area = z.infer<typeof areaSchema>;
export type Resource = z.infer<typeof resourceSchema>;
