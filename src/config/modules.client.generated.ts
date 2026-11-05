// Written by `npm run generate:modules` from the folders of src/modules; do not edit. A test fails when it is stale (ADR 0017 §5).

import type { ViewRenderer } from "@/core/views/ui";
import { catalogModuleUi } from "@/modules/catalog/ui";
import { inventoryModuleUi } from "@/modules/inventory/ui";

import type { ProductViewKindId } from "./vertical";

/** The renderer of each product view kind, from the `ui.ts` of the modules that declare it (ADR 0018 §3). */
export const VIEW_RENDERERS = { ...catalogModuleUi.views, ...inventoryModuleUi.views } as const satisfies Readonly<
  Record<ProductViewKindId, ViewRenderer>
>;
