import type { BookingInput } from "@/modules/bookings";
import type { CatalogItem } from "@/modules/catalog";
import type { Asset, Customer } from "@/modules/customers";
import type { Party } from "@/modules/parties";
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
  {
    id: "part-oil-filter",
    kind: "product",
    name: text("Oil filter", "Filtro de aceite", "Ölfilter", "Filtre à huile"),
    categoryId: "parts",
    price: eur(1200),
    status: "active",
    media: [],
    tags: [],
    ext: { sku: "OF-204", stock: 14, supplier: "Distribuciones Levante" },
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
    ext: { sku: "AF-311", stock: 9, supplier: "Recambios Norte" },
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
    ext: { sku: "WB-450", stock: 4, supplier: "Recambios Norte" },
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

/** Fictitious fiscal directory (ADR 0019 §5): tax IDs that cannot be real and `.example` addresses. */
export const parties: Party[] = [
  {
    id: "fleet-company",
    kind: "company",
    legalName: "Transportes Rápidos del Sur S.L.",
    tradeName: "Rápidos del Sur",
    taxId: "B00000209",
    addressLines: ["Polígono Las Salinas 4", "30169 San Ginés", "Spain"],
    countryCode: "ES",
    email: "flota@rapidos-del-sur.example",
    roles: ["client"],
  },
  {
    id: "insurer",
    kind: "company",
    legalName: "Aseguradora Mediterránea S.A.",
    taxId: "A00000210",
    addressLines: ["Avenida de la Constitución 30", "46009 Valencia", "Spain"],
    countryCode: "ES",
    email: "siniestros@aseguradora-mediterranea.example",
    roles: ["client"],
  },
  {
    id: "distribuciones-levante",
    kind: "company",
    legalName: "Distribuciones Levante",
    taxId: "B00000211",
    addressLines: ["Calle del Recambio 9", "46013 Valencia", "Spain"],
    countryCode: "ES",
    email: "pedidos@distribuciones-levante.example",
    roles: ["supplier"],
  },
  {
    id: "recambios-norte",
    kind: "company",
    legalName: "Recambios Norte",
    taxId: "B00000212",
    addressLines: ["Polígono Industrial Ebro 21", "50014 Zaragoza", "Spain"],
    countryCode: "ES",
    email: "ventas@recambios-norte.example",
    roles: ["supplier"],
  },
];

export const workshopSeed = { areas, resources, customers, assets, parties, catalog, staff, bookings } as const;
