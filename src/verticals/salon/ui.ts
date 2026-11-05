import { CalendarDays, House, type LucideIcon, UsersRound } from "lucide-react";

import type { salon } from "./index";

type NavId = (typeof salon.nav)[number]["id"];

/** The icon of each navigation entry, kept out of the preset's index so the server kernel never loads lucide-react. */
export const salonNavIcons = {
  home: House,
  bookings: CalendarDays,
  customers: UsersRound,
} as const satisfies Readonly<Record<NavId, LucideIcon>>;
