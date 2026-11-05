import type { Customer } from "@/modules/customers";

import { eur } from "./shared";

export const customers: Customer[] = [
  {
    id: "client-nora",
    name: "Nora",
    phone: "+34600000201",
    consent: { marketing: true },
    tags: [],
    vip: true,
    blocked: false,
    notes: [],
    figures: { visits: 12, spend: eur(52_000), lastVisit: "2026-09-26T00:00:00Z", noShows: 0 },
    ext: { colourFormula: "6.3 + 7.1, 1:1.5, 35 min" },
  },
  {
    id: "client-leo",
    name: "Leo",
    email: "leo@example.com",
    consent: { marketing: false },
    tags: [],
    vip: false,
    blocked: false,
    notes: [],
    figures: { visits: 2, spend: eur(7600), lastVisit: "2026-08-14T00:00:00Z", noShows: 1 },
    ext: {},
  },
];
