import { z } from "zod";

export const customerExtSchema = z.object({ colourFormula: z.string().min(1).optional() }).strict();

/** Commission is a share of the service price, in basis points to stay integer. */
export const catalogItemExtSchema = z
  .object({ requiredSkill: z.string().min(1), commissionBp: z.number().int().min(0).max(10_000) })
  .strict();

export const staffExtSchema = z.object({ commissionBp: z.number().int().min(0).max(10_000) }).strict();
