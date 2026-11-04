import type { LucideIcon } from "lucide-react";

import { hospitalityNavIcons } from "@/verticals/hospitality/ui";
import { salonNavIcons } from "@/verticals/salon/ui";
import { workshopNavIcons } from "@/verticals/workshop/ui";

import type { VerticalId } from "./vertical";

/** The navigation icons of each preset, by entry id: the UI half of `VERTICALS[id].nav` (ADR 0006). */
export const NAV_ICONS: Readonly<Record<VerticalId, Readonly<Record<string, LucideIcon>>>> = {
  hospitality: hospitalityNavIcons,
  salon: salonNavIcons,
  workshop: workshopNavIcons,
};
