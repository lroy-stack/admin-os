import type { CatalogItem } from "@/modules/catalog";

import { eur, text } from "./shared";

export const catalog: CatalogItem[] = [
  {
    id: "part-brake-pads",
    kind: "product",
    name: text("Front brake pads", "Pastillas de freno delanteras", "Bremsbeläge vorne", "Plaquettes de frein avant"),
    categoryId: "parts",
    price: eur(4900),
    status: "active",
    media: [],
    tags: [],
  },
  {
    id: "labour-brakes",
    kind: "service",
    name: text("Brake service labour", "Mano de obra frenos", "Arbeit Bremsen", "Main-d'œuvre freins"),
    categoryId: "labour",
    price: eur(7200),
    durationMin: 90,
    status: "active",
    media: [],
    tags: [],
    ext: { rateClass: "standard" },
  },
  {
    id: "part-oil-filter",
    kind: "product",
    name: text("Oil filter", "Filtro de aceite", "Ölfilter", "Filtre à huile"),
    categoryId: "parts",
    price: eur(1200),
    status: "active",
    media: [],
    tags: [],
  },
  {
    id: "part-air-filter",
    kind: "product",
    name: text("Air filter", "Filtro de aire", "Luftfilter", "Filtre à air"),
    categoryId: "parts",
    price: eur(1800),
    status: "active",
    media: [],
    tags: [],
  },
  {
    id: "part-wiper-blades",
    kind: "product",
    name: text(
      "Wiper blades, pair",
      "Escobillas limpiaparabrisas, par",
      "Scheibenwischerblätter, Paar",
      "Balais d'essuie-glace, paire",
    ),
    categoryId: "parts",
    price: eur(2200),
    status: "active",
    media: [],
    tags: [],
  },
];
