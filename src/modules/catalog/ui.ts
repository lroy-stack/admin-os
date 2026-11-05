import type { ModuleUi } from "@/core/views/ui";

import { CatalogCollection } from "./views/collection";

/** The client half of the catalog module (ADR 0017 §1): the renderer of its product view kind. */
export const catalogModuleUi = {
  views: { "catalog.collection": CatalogCollection },
} as const satisfies ModuleUi;
