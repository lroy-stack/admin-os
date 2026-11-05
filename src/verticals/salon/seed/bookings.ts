import type { BookingInput } from "@/modules/bookings";

import { at, BUSINESS_DAY, eur } from "./shared";

const base = { businessDay: BUSINESS_DAY, tags: [] };

export const bookings: BookingInput[] = [
  {
    ...base,
    id: "A-201",
    status: "confirmed",
    startMin: at(10),
    endMin: at(12),
    resourceIds: ["chair-1"],
    staffIds: ["stylist-ines"],
    customerId: "client-nora",
    lines: [
      { catalogItemId: "svc-colour", qty: 1, durationMin: 75, unitPrice: eur(6500) },
      { catalogItemId: "svc-cut", qty: 1, durationMin: 45, unitPrice: eur(3800) },
    ],
    origin: "staff",
    channel: "phone",
  },
  {
    ...base,
    id: "A-202",
    status: "awaiting_payment",
    deposit: { amount: eur(1000), status: "due" },
    startMin: at(11),
    endMin: at(11, 45),
    resourceIds: ["chair-2"],
    staffIds: ["stylist-pau"],
    customerId: "client-leo",
    lines: [{ catalogItemId: "svc-cut", qty: 1, durationMin: 45, unitPrice: eur(3800) }],
    origin: "online",
    channel: "instagram",
    guestNote: "Wants a shorter fade",
  },
  {
    ...base,
    id: "A-203",
    status: "in_progress",
    startMin: at(12),
    endMin: at(12, 20),
    resourceIds: ["chair-3"],
    staffIds: ["stylist-ines"],
    lines: [{ catalogItemId: "svc-treatment", qty: 1, durationMin: 20, unitPrice: eur(2200) }],
    origin: "walk_in",
  },
  {
    ...base,
    id: "A-204",
    status: "confirmed",
    startMin: at(14),
    endMin: at(14, 45),
    resourceIds: ["chair-2"],
    staffIds: ["stylist-pau"],
    contactName: "Elena",
    lines: [{ catalogItemId: "svc-cut", qty: 1, durationMin: 45, unitPrice: eur(3800) }],
    origin: "staff",
    channel: "phone",
  },
];
