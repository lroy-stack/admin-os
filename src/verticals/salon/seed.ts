import type { BookingInput } from "@/modules/bookings";
import type { CatalogItem } from "@/modules/catalog";
import type { Customer } from "@/modules/customers";
import type { Party } from "@/modules/parties";
import type { Area, Resource } from "@/modules/resources";
import type { Shift, StaffMember } from "@/modules/staff";

/** Salon mock data in the generic contracts: stylist = staffIds, chair = resourceIds, services = lines. */

export const BUSINESS_DAY = "2026-10-31";
const at = (hours: number, minutes = 0) => hours * 60 + minutes;
const eur = (amountMinor: number) => ({ amountMinor, currency: "EUR" });
const text = (en: string, es: string, de: string, fr: string) => ({ source: en, translations: { en, es, de, fr } });

export const areas: Area[] = [{ id: "floor", label: "Salon floor" }];

const chair = (id: string): Resource => ({ id, kind: "chair", label: id, areaId: "floor", active: true });

export const resources: Resource[] = [chair("chair-1"), chair("chair-2"), chair("chair-3")];

export const catalog: CatalogItem[] = [
  {
    id: "svc-cut",
    kind: "service",
    name: text("Cut and finish", "Corte y peinado", "Schnitt und Styling", "Coupe et coiffage"),
    categoryId: "hair",
    price: eur(3800),
    durationMin: 45,
    status: "active",
    media: [],
    tags: [],
    ext: { requiredSkill: "cut", commissionBp: 4000 },
  },
  {
    id: "svc-colour",
    kind: "service",
    name: text("Full colour", "Tinte completo", "Komplettfärbung", "Coloration complète"),
    categoryId: "hair",
    price: eur(6500),
    durationMin: 75,
    status: "active",
    media: [],
    tags: [],
    ext: { requiredSkill: "colour", commissionBp: 3500 },
  },
  {
    id: "svc-treatment",
    kind: "service",
    name: text("Deep treatment", "Tratamiento intensivo", "Intensivkur", "Soin intensif"),
    categoryId: "care",
    price: eur(2200),
    durationMin: 20,
    status: "active",
    media: [],
    tags: [],
    ext: { requiredSkill: "colour", commissionBp: 3000 },
  },
  {
    id: "retail-shampoo",
    kind: "product",
    name: text(
      "Repair shampoo, 250 ml",
      "Champú reparador, 250 ml",
      "Reparatur-Shampoo, 250 ml",
      "Shampooing réparateur, 250 ml",
    ),
    categoryId: "shop",
    price: eur(1600),
    status: "active",
    media: [],
    tags: [],
    ext: { commissionBp: 1000 },
  },
  {
    id: "retail-conditioner",
    kind: "product",
    name: text(
      "Hydrating conditioner, 250 ml",
      "Acondicionador hidratante, 250 ml",
      "Feuchtigkeitsspülung, 250 ml",
      "Après-shampooing hydratant, 250 ml",
    ),
    categoryId: "shop",
    price: eur(1700),
    status: "active",
    media: [],
    tags: [],
    ext: { commissionBp: 1000 },
  },
  {
    id: "retail-wax",
    kind: "product",
    name: text("Styling wax, 75 ml", "Cera de peinado, 75 ml", "Stylingwachs, 75 ml", "Cire coiffante, 75 ml"),
    categoryId: "shop",
    price: eur(1200),
    status: "active",
    media: [],
    tags: [],
    ext: { commissionBp: 1000 },
  },
];

export const staff: StaffMember[] = [
  {
    id: "stylist-ines",
    name: "Inés",
    roleIds: ["staff"],
    status: "active",
    locationIds: ["salon"],
    skills: ["cut", "colour"],
    contract: { type: "employee", startDate: "2021-09-01" },
    ext: { commissionBp: 4000 },
  },
  {
    id: "stylist-pau",
    name: "Pau",
    roleIds: ["staff"],
    status: "active",
    locationIds: ["salon"],
    skills: ["cut"],
    ext: { commissionBp: 3500 },
  },
];

export const shifts: Shift[] = [
  { id: "shift-ines", staffId: "stylist-ines", businessDay: BUSINESS_DAY, startMin: at(9), endMin: at(17) },
  { id: "shift-pau", staffId: "stylist-pau", businessDay: BUSINESS_DAY, startMin: at(10), endMin: at(18) },
];

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

/** Fictitious fiscal directory (ADR 0019 §5): tax IDs that cannot be real and `.example` addresses. */
export const parties: Party[] = [
  {
    id: "hotel-spa",
    kind: "company",
    legalName: "Hotel Balneario Costa Azul S.L.",
    tradeName: "Spa Costa Azul",
    taxId: "B00000206",
    addressLines: ["Paseo Marítimo 20", "03503 Benidorm", "Spain"],
    countryCode: "ES",
    email: "administracion@balneario-costa-azul.example",
    roles: ["client"],
  },
  {
    id: "photo-studio",
    kind: "company",
    legalName: "Estudio Fotográfico Luz Norte S.L.",
    tradeName: "Luz Norte",
    taxId: "B00000207",
    addressLines: ["Calle de la Luz 7", "03002 Alicante", "Spain"],
    countryCode: "ES",
    email: "facturas@luz-norte.example",
    roles: ["client"],
  },
  {
    id: "cosmetics-distributor",
    kind: "company",
    legalName: "Distribuciones Cosméticas Profesionales S.L.",
    tradeName: "Cosméticas Profesionales",
    taxId: "B00000208",
    addressLines: ["Calle del Taller 15", "28045 Madrid", "Spain"],
    countryCode: "ES",
    email: "pedidos@cosmeticas-profesionales.example",
    roles: ["supplier"],
  },
];

export const salonSeed = { areas, resources, customers, parties, catalog, staff, shifts, bookings } as const;
