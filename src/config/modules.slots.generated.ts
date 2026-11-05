// Written by `npm run generate:modules` from the folders of src/modules; do not edit. A test fails when it is stale (ADR 0017 §5).

import { customersModuleUi } from "@/modules/customers/ui";

/** The fill of each route slot, from the `ui.ts` of the modules that fill it; a route takes the ones it declares. */
export const SLOT_FILLS = { ...customersModuleUi.slots } as const;
