import type { BookingInput } from "@/modules/bookings";

import { at, BUSINESS_DAY, eur } from "./shared";

export const bookings: BookingInput[] = [
  {
    id: "W-301",
    status: "confirmed",
    businessDay: BUSINESS_DAY,
    startMin: at(8),
    endMin: at(9, 30),
    resourceIds: ["bay-1"],
    staffIds: ["mech-rafa"],
    customerId: "cust-carmen",
    lines: [
      { catalogItemId: "part-brake-pads", qty: 1, durationMin: 0, unitPrice: eur(4900) },
      { catalogItemId: "labour-brakes", qty: 1, durationMin: 90, unitPrice: eur(7200) },
    ],
    origin: "staff",
    channel: "phone",
    guestNote: "Squeak when braking",
    tags: [],
    ext: { assetId: "veh-1" },
  },
];
