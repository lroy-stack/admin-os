import { defineModule } from "@/core/module";

import { catalogCapabilities } from "./capabilities";
import { catalogItemSchema } from "./schema";

/** The catalog module's manifest (ADR 0017 §1). The invoice is its route until `parties` exists (ADR 0019). */
export const catalogModule = defineModule({
  id: "catalog",
  capabilities: catalogCapabilities,
  settings: [],
  mcp: {
    noun: "catalog items",
    idSources: [],
    tools: {
      "catalog.list": { expose: true, title: "List catalog items" },
    },
  },
  seed: {
    catalog: { schema: catalogItemSchema, required: true, ext: { entity: "catalogItem", optional: false } },
  },
  references: [],
  owns: ["src/app/(main)/dashboard/invoice", "src/config/catalog-collections.test.ts", "e2e/smoke/invoice.spec.ts"],
});
