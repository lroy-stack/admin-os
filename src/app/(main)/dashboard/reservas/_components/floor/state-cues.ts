import { AlarmClock, Ban, Clock, LogOut, type LucideIcon, Users } from "lucide-react";

import type { VisibleTableState } from "./table-state";

export type TableStateCue = {
  /** Glyph on the table plate and in the legend; free tables are the only ones with a bare plate. */
  icon: LucideIcon | null;
  /** Pattern the 3D scene lays over the table top. */
  pattern: "stripes" | "dots" | null;
};

/**
 * What tells each table state apart besides its colour (WCAG 2.2 SC 1.4.1 Use of Color). The plate glyph and the
 * legend carry every state at any zoom; late and blocked also get a pattern; the callout and the plate's accessible
 * name spell the state out.
 */
export const tableStateCues: Record<VisibleTableState, TableStateCue> = {
  free: { icon: null, pattern: null },
  arriving: { icon: Clock, pattern: null },
  seated: { icon: Users, pattern: null },
  leaving: { icon: LogOut, pattern: null },
  late: { icon: AlarmClock, pattern: "stripes" },
  blocked: { icon: Ban, pattern: "dots" },
};
