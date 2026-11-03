import { defineCapability } from "@/core/capability";
import { pageInput, pageOutput } from "@/core/pagination";

import { bookingSchema } from "./schema";

export const bookingsList = defineCapability({
  id: "bookings.list",
  summary: "List bookings, one page at a time.",
  input: pageInput({ defaultLimit: 50, maxLimit: 200 }),
  output: pageOutput(bookingSchema),
  permission: "read:bookings",
  effect: "read",
  riskTier: 1,
});

export const bookingsCapabilities = { "bookings.list": bookingsList } as const;
