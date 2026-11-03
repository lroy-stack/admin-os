import { defineCapability } from "@/core/capability";
import { pageInput, pageOutput } from "@/core/pagination";

import { resourceSchema } from "./schema";

export const resourcesList = defineCapability({
  id: "resources.list",
  summary: "List resources, one page at a time.",
  input: pageInput({ defaultLimit: 50, maxLimit: 200 }),
  output: pageOutput(resourceSchema),
  permission: "read:resources",
  effect: "read",
  riskTier: 0,
});

export const resourcesCapabilities = { "resources.list": resourcesList } as const;
