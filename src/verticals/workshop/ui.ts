import { CalendarClock, House, IdCard, type LucideIcon, UsersRound } from "lucide-react";

import type { workshop } from "./index";

type NavId = (typeof workshop.nav)[number]["id"];

/** The icon of each navigation entry, kept out of the preset's index so the server kernel never loads lucide-react. */
export const workshopNavIcons = {
  home: House,
  bookings: CalendarClock,
  customers: UsersRound,
  staff: IdCard,
} as const satisfies Readonly<Record<NavId, LucideIcon>>;
