import { defineCapability } from "@/core/capability";
import { pageInput, pageOutput } from "@/core/pagination";

import { catalogItemSchema } from "./schema";

export const catalogList = defineCapability({
  id: "catalog.list",
  summary: "List catalog items, one page at a time.",
  input: pageInput({ defaultLimit: 50, maxLimit: 200 }),
  output: pageOutput(catalogItemSchema),
  permission: "read:catalog",
  effect: "read",
});

export const catalogCapabilities = { "catalog.list": catalogList } as const;
