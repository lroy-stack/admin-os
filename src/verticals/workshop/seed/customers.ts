import type { Asset, Customer } from "@/modules/customers";

import { eur } from "./shared";

export const customers: Customer[] = [
  {
    id: "cust-carmen",
    name: "Carmen",
    phone: "+34600000301",
    tags: [],
    vip: false,
    blocked: false,
    notes: [],
    figures: { visits: 3, spend: eur(41_000), lastVisit: "2026-04-02T00:00:00Z", noShows: 0 },
  },
];

export const assets: Asset[] = [
  {
    id: "veh-1",
    customerId: "cust-carmen",
    kind: "vehicle",
    label: "Hatchback 2018",
    ext: { plate: "0000-ABC", make: "Seat", model: "Ibiza", mileageKm: 84_500 },
  },
];
