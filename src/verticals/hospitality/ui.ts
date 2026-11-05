import { CalendarDays, House, type LucideIcon, Package, UsersRound } from "lucide-react";

import type { hospitality } from "./index";

type NavId = (typeof hospitality.nav)[number]["id"];

/** The icon of each navigation entry, kept out of the preset's index so the server kernel never loads lucide-react. */
export const hospitalityNavIcons = {
  home: House,
  bookings: CalendarDays,
  customers: UsersRound,
  products: Package,
} as const satisfies Readonly<Record<NavId, LucideIcon>>;
