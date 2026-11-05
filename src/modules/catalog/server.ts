import "server-only";

import type { ModuleServer } from "@/core/module";

import { loadCatalogCollection } from "./collection-loader";
import { catalogCollectionBundle } from "./collection-messages";
import { catalogMessages } from "./messages";
import { catalogMockHandlers } from "./mock";
import { catalogModule } from "./module";

/** The server half of the catalog module (ADR 0017 §1): its messages, its mock answers and its view loader. */
export const catalogModuleServer = {
  id: catalogModule.id,
  messages: catalogMessages,
  mockHandlers: catalogMockHandlers,
  viewLoaders: { "catalog.collection": loadCatalogCollection },
  viewBundles: { "catalog.collection": catalogCollectionBundle },
} satisfies ModuleServer<typeof catalogModule.id>;
