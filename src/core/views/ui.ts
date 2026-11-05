import type { ComponentType } from "react";

import type { ViewData } from "./index";

/** The client half of a view kind: renders what its loader returned. Typed `never` so each renderer keeps its own rows. */
export type ViewRenderer = ComponentType<{ readonly data: ViewData<never> }>;

/**
 * A module's `ui.ts` (ADR 0017 §1), exported as `<module>ModuleUi`: its renderers by view kind id, and the fills of the
 * route slots it fills by slot id. Each shape is the route's own contract, which the route checks by assignment.
 */
export interface ModuleUi {
  readonly views?: Readonly<Record<string, ViewRenderer>>;
  readonly slots?: Readonly<Record<string, unknown>>;
}
