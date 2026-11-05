import type { Customer } from "@/modules/customers";

import { eur } from "./shared";

const customerFigures = (visits: number, averageSpend: number, lastVisit: string, noShows = 0) => ({
  visits,
  spend: eur(visits * averageSpend * 100),
  lastVisit: `${lastVisit}T00:00:00Z`,
  noShows,
});

export const customers: Customer[] = [
  {
    id: "C-iglesias",
    name: "Iglesias",
    phone: "+34600000101",
    locale: "es",
    consent: { marketing: true },
    tags: ["Regular"],
    vip: false,
    blocked: false,
    notes: [],
    figures: customerFigures(14, 58, "2026-10-17"),
    ext: { allergens: [], dietaryRestrictions: [] },
  },
  {
    id: "C-ortega",
    name: "Ortega",
    phone: "+34600000102",
    email: "ortega@example.com",
    locale: "es",
    consent: { marketing: false },
    tags: [],
    vip: false,
    blocked: false,
    notes: [
      {
        id: "note-ortega-1",
        text: "One guest is coeliac",
        authorId: "demo-owner",
        authorName: "Alex Morgan",
        day: "2026-09-30",
        minute: 21 * 60,
      },
    ],
    figures: customerFigures(6, 52, "2026-09-30"),
    ext: { allergens: ["gluten"], dietaryRestrictions: ["Gluten-free"] },
  },
  {
    id: "C-bravo",
    name: "Bravo",
    phone: "+34600000103",
    locale: "es",
    consent: { marketing: true },
    tags: ["Regular"],
    vip: true,
    blocked: false,
    notes: [],
    figures: customerFigures(8, 61, "2026-10-24"),
    ext: { allergens: ["milk"], dietaryRestrictions: ["Lactose-free"] },
  },
  {
    id: "C-calvo",
    name: "Calvo",
    email: "calvo@example.com",
    locale: "es",
    consent: { marketing: false },
    tags: ["Company"],
    vip: false,
    blocked: false,
    notes: [],
    figures: { visits: 1, spend: null, lastVisit: null, noShows: 0 },
    ext: { allergens: ["nuts"], dietaryRestrictions: [] },
  },
];
