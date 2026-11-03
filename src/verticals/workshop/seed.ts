import type { BookingInput } from "@/modules/bookings";
import type { CatalogItem } from "@/modules/catalog";
import type { Asset, Customer } from "@/modules/customers";
import type { Area, Resource } from "@/modules/resources";
import type { StaffMember } from "@/modules/staff";

/** Workshop seed sketch: a drop-off on a bay, a vehicle as a customer asset, parts and labour as catalog items. */

export const BUSINESS_DAY = "2026-10-31";
const at = (hours: number, minutes = 0) => hours * 60 + minutes;
const eur = (amountMinor: number) => ({ amountMinor, currency: "EUR" });
const text = (en: string, es: string, de: string, fr: string) => ({ source: en, translations: { en, es, de, fr } });

export const areas: Area[] = [{ id: "shop", label: "Shop floor" }];

export const resources: Resource[] = [{ id: "bay-1", kind: "bay", label: "Bay 1", areaId: "shop", active: true }];

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
    ext: { sku: "BP-F-118", stock: 6, supplier: "Distribuciones Levante" },
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
];

export const staff: StaffMember[] = [
  {
    id: "mech-rafa",
    name: "Rafa",
    roleIds: ["staff"],
    status: "active",
    locationIds: ["branch"],
    skills: ["brakes", "diagnostics"],
    contract: { type: "employee", startDate: "2019-05-13", hoursPerWeek: 40 },
    ext: { certifications: ["EV safety"] },
  },
];

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

export const workshopSeed = { areas, resources, customers, assets, catalog, staff, bookings } as const;
