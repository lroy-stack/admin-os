import { z } from "zod";

import { defineCapability } from "@/core/capability";
import { pageInput, pageOutput } from "@/core/pagination";

import { catalogItemSchema } from "./schema";

export const catalogList = defineCapability({
  id: "catalog.list",
  summary:
    "List catalog items, one page at a time, in catalog order. Send categoryIds to keep only the items of those categories; each item's categoryId names its category.",
  input: pageInput({ defaultLimit: 50, maxLimit: 200 }).extend({
    categoryIds: z.array(z.string().min(1).max(64)).min(1).max(20).optional(),
  }),
  output: pageOutput(catalogItemSchema),
  permission: "read:catalog",
  effect: "read",
  riskTier: 0,
});

export const catalogCapabilities = { "catalog.list": catalogList } as const;
