import { z } from "zod";

import { defineModule } from "@/core/module";
import { defineViewKind } from "@/core/views";

import { catalogCapabilities, categoryIdsSchema } from "./capabilities";
import { catalogItemSchema } from "./schema";

/** A named set of the preset's categories, read through `catalog.list` (ADR 0018 §2, §3): the menu, the shop. */
export const catalogCollectionView = defineViewKind({
  id: "catalog.collection",
  module: "catalog",
  capability: "catalog.list",
  params: z.object({ categoryIds: categoryIdsSchema }),
});

/** The catalog module's manifest (ADR 0017 §1). */
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
    catalog: { schema: catalogItemSchema, required: true, ext: { entity: "catalogItem", optional: true } },
  },
  references: [],
  owns: [
    "src/app/(main)/dashboard/products",
    "src/config/catalog-collections.test.ts",
    "src/config/mcp.server.catalog.test.ts",
    "e2e/smoke/products.spec.ts",
  ],
  views: [catalogCollectionView],
});
