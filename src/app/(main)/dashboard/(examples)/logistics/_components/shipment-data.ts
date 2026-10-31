/**
 * Demo shipments as data: ids, enums, numbers and coordinates only. Every sentence the screen shows (cargo, handling
 * notes, statuses, places such as "Aeropuerto CGK", ETA wording) lives in the route dictionary and is resolved for
 * one locale by `localizeShipments`. People, companies, cities and transport numbers are proper nouns and stay as
 * they are.
 */

export type ShipmentStatus =
  | "scheduled"
  | "inTransit"
  | "outForDelivery"
  | "delivered"
  | "delayed"
  | "onHold"
  | "customsHold";

export type TransportMode = "land" | "air" | "sea";
export type RouteType = "road" | "flight" | "ship";
export type CustomerTier = "priority" | "standard" | "nonPriority";
export type TierNote = "topVolume" | "recurring" | "managed" | "occasional";

export type GeoCoordinate = [longitude: number, latitude: number];

/** How a place is named: "{name} Airport", "{name} Port", "Port of {name}", or the bare name of a city. */
export type PlaceKind = "airport" | "port" | "portOf" | "city";

export type EtaNote =
  | "today"
  | "tomorrow"
  | "tonight"
  | "deliveredToday"
  | "deliveredYesterday"
  | "departingToday"
  | "departing"
  | "pending"
  | "nextWeek"
  | "awaitingRelease"
  | "customs"
  | "warehouse"
  | "security";

/** One half of the ETA line: a wall-clock time ("14:50"), a weekday (0 is Sunday) or a dictionary note. */
export type EtaPart =
  | { readonly kind: "time"; readonly time: string }
  | { readonly kind: "weekday"; readonly weekday: number }
  | { readonly kind: "note"; readonly note: EtaNote };

export type HandlingLabelId =
  | "fragileElectronics"
  | "heavyMachinery"
  | "temperatureControlled"
  | "standardFreight"
  | "heavyBulk"
  | "sensitiveMedical"
  | "industrialParts"
  | "highValueFragile"
  | "foodGrade"
  | "perishable"
  | "highValue"
  | "moistureSensitive"
  | "standardPalletized"
  | "fragileBulky"
  | "highValuePrecision"
  | "hazmatReview";

export type HandlingTagId =
  | "doNotStack"
  | "keepUpright"
  | "signatureRequired"
  | "forkliftOnly"
  | "secureLoad"
  | "doNotTip"
  | "temperatureLog"
  | "keepFrozen"
  | "sealIntact"
  | "keepDry"
  | "doNotCrush"
  | "standardHandoff"
  | "heavyLift"
  | "callBeforeDelivery"
  | "foodGrade"
  | "perishable"
  | "ventilatedHold"
  | "inspectOnArrival"
  | "highValue"
  | "countOnArrival"
  | "twoPersonLift"
  | "escalateDelay"
  | "securityHold"
  | "hazmatReview"
  | "restrictedHandling";

export type PlaceSource = {
  readonly kind: PlaceKind;
  /** A proper noun: a city, an IATA airport code or a port name. */
  readonly name: string;
  /** ISO 3166-1 alpha-2; the country name comes from `Intl.DisplayNames`. */
  readonly countryCode: string;
  readonly coordinates: GeoCoordinate;
};

export type CustomerSource = {
  readonly name: string;
  readonly initials: string;
  readonly id: string;
  readonly tier: CustomerTier;
  readonly tierNote: TierNote;
};

export type ShipmentSource = {
  readonly id: string;
  readonly customer: CustomerSource;
  readonly origin: PlaceSource;
  readonly destination: PlaceSource;
  readonly handling: { readonly label: HandlingLabelId; readonly tags: readonly HandlingTagId[] };
  readonly weightKg: number;
  readonly eta: EtaPart;
  readonly etaMeta: EtaPart;
  readonly status: ShipmentStatus;
  /** Percent, 0 to 100. */
  readonly progress: number;
  readonly mode: TransportMode;
  readonly routeType: RouteType;
  readonly transportNumber: string;
};

/** The tab counters of the shipment list (the fleet is larger than the demo list). */
export const shipmentTotals = { all: 156, inTransit: 32, delivered: 98, delayed: 9 } as const;

const customerAccounts = {
  techCorp: { name: "TechCorp", initials: "TC", id: "SDA-1001-2401-01", tier: "priority", tierNote: "topVolume" },
  regionalRoadExpress: {
    name: "Regional Road Express",
    initials: "RR",
    id: "SDA-1002-2402-02",
    tier: "priority",
    tierNote: "topVolume",
  },
  sendWell: { name: "SendWell B.V.", initials: "SW", id: "SDA-1003-2403-03", tier: "priority", tierNote: "topVolume" },
  sourceDay: { name: "SourceDay", initials: "SD", id: "SDA-1004-2404-04", tier: "standard", tierNote: "recurring" },
  shippingEasy: {
    name: "ShippingEasy",
    initials: "SE",
    id: "SDA-1005-2405-05",
    tier: "standard",
    tierNote: "recurring",
  },
  freightView: { name: "FreightView", initials: "FV", id: "SDA-1006-2406-06", tier: "priority", tierNote: "topVolume" },
  logisticsPlus: {
    name: "Logistics Plus",
    initials: "LP",
    id: "SDA-1007-2407-07",
    tier: "standard",
    tierNote: "managed",
  },
  transvirtual: {
    name: "Transvirtual",
    initials: "TV",
    id: "SDA-1008-2408-08",
    tier: "standard",
    tierNote: "managed",
  },
  skyTrack: { name: "SkyTrack", initials: "ST", id: "SDA-1009-2409-09", tier: "nonPriority", tierNote: "occasional" },
  maersk: { name: "Maersk", initials: "MK", id: "SDA-1010-2410-10", tier: "priority", tierNote: "topVolume" },
  flexport: { name: "Flexport", initials: "FX", id: "SDA-1011-2411-11", tier: "priority", tierNote: "topVolume" },
  piedPiper: {
    name: "Pied Piper",
    initials: "PP",
    id: "SDA-1012-2412-12",
    tier: "nonPriority",
    tierNote: "occasional",
  },
} as const satisfies Record<string, CustomerSource>;

const places = {
  cgk: { kind: "airport", name: "CGK", countryCode: "ID", coordinates: [106.6429036, -6.1238696] },
  sin: { kind: "airport", name: "SIN", countryCode: "SG", coordinates: [103.9949824, 1.3510921] },
  surabaya: { kind: "city", name: "Surabaya", countryCode: "ID", coordinates: [112.7377674, -7.2462836] },
  semarang: { kind: "city", name: "Semarang", countryCode: "ID", coordinates: [110.4229104, -6.9903988] },
  tanjungPriok: {
    kind: "port",
    name: "Tanjung Priok",
    countryCode: "ID",
    coordinates: [106.8805674, -6.1045642],
  },
  singaporePort: { kind: "portOf", name: "Singapore", countryCode: "SG", coordinates: [103.7566, 1.2788] },
  kul: { kind: "airport", name: "KUL", countryCode: "MY", coordinates: [101.7063995, 2.7431274] },
  bkk: { kind: "airport", name: "BKK", countryCode: "TH", coordinates: [100.7485803, 13.6818767] },
  bandung: { kind: "city", name: "Bandung", countryCode: "ID", coordinates: [107.6070833, -6.9218457] },
  yogyakarta: { kind: "city", name: "Yogyakarta", countryCode: "ID", coordinates: [110.3672845, -7.7953473] },
  portKlang: { kind: "city", name: "Port Klang", countryCode: "MY", coordinates: [101.3913589, 2.9996963] },
  laemChabang: { kind: "port", name: "Laem Chabang", countryCode: "TH", coordinates: [100.8994177, 13.0734119] },
  hkg: { kind: "airport", name: "HKG", countryCode: "HK", coordinates: [113.9172999, 22.3125986] },
  mnl: { kind: "airport", name: "MNL", countryCode: "PH", coordinates: [121.0219223, 14.5122467] },
  jakarta: { kind: "city", name: "Jakarta", countryCode: "ID", coordinates: [106.827168, -6.1754049] },
  shanghai: { kind: "port", name: "Shanghai", countryCode: "CN", coordinates: [121.4872194, 31.2219444] },
  busan: { kind: "port", name: "Busan", countryCode: "KR", coordinates: [129.0492086, 35.1177052] },
  nrt: { kind: "airport", name: "NRT", countryCode: "JP", coordinates: [140.3933101, 35.7758714] },
  icn: { kind: "airport", name: "ICN", countryCode: "KR", coordinates: [126.4417093, 37.4634593] },
  kualaLumpur: { kind: "city", name: "Kuala Lumpur", countryCode: "MY", coordinates: [101.6942371, 3.1516964] },
  penang: { kind: "city", name: "Penang", countryCode: "MY", coordinates: [100.3287352, 5.4141619] },
  cebu: { kind: "port", name: "Cebu", countryCode: "PH", coordinates: [123.9174564, 10.3054355] },
  davao: { kind: "port", name: "Davao", countryCode: "PH", coordinates: [125.6627111, 7.1265272] },
  dps: { kind: "airport", name: "DPS", countryCode: "ID", coordinates: [115.1673704, -8.746515] },
  manilaPort: { kind: "portOf", name: "Manila", countryCode: "PH", coordinates: [120.9522815, 14.6038906] },
  medan: { kind: "city", name: "Medan", countryCode: "ID", coordinates: [98.6741623, 3.5894617] },
  pekanbaru: { kind: "city", name: "Pekanbaru", countryCode: "ID", coordinates: [101.4515727, 0.5262455] },
  bom: { kind: "airport", name: "BOM", countryCode: "IN", coordinates: [72.8638223, 19.0901376] },
  del: { kind: "airport", name: "DEL", countryCode: "IN", coordinates: [77.0847985, 28.5553942] },
  rotterdam: { kind: "port", name: "Rotterdam", countryCode: "NL", coordinates: [4.4298268, 51.904333] },
  hamburg: { kind: "port", name: "Hamburg", countryCode: "DE", coordinates: [9.9118353, 53.5279971] },
  hoChiMinhCity: { kind: "city", name: "Ho Chi Minh City", countryCode: "VN", coordinates: [106.7166008, 10.7737261] },
  daNang: { kind: "city", name: "Da Nang", countryCode: "VN", coordinates: [108.212, 16.068] },
  dxb: { kind: "airport", name: "DXB", countryCode: "AE", coordinates: [55.3666519, 25.2515424] },
  jed: { kind: "airport", name: "JED", countryCode: "SA", coordinates: [39.1634852, 21.6839754] },
  nhavaSheva: { kind: "port", name: "Nhava Sheva", countryCode: "IN", coordinates: [72.952661, 18.9470339] },
  colombo: { kind: "port", name: "Colombo", countryCode: "LK", coordinates: [79.8564409, 6.9646289] },
  chiangMai: { kind: "city", name: "Chiang Mai", countryCode: "TH", coordinates: [98.9858802, 18.7882778] },
  bangkok: { kind: "city", name: "Bangkok", countryCode: "TH", coordinates: [100.4935089, 13.7524938] },
  kix: { kind: "airport", name: "KIX", countryCode: "JP", coordinates: [135.222523, 34.4342045] },
  tpe: { kind: "airport", name: "TPE", countryCode: "TW", coordinates: [121.2345977, 25.0793174] },
  bandarLampung: { kind: "city", name: "Bandar Lampung", countryCode: "ID", coordinates: [105.2643742, -5.4460713] },
} as const satisfies Record<string, PlaceSource>;

const note = (value: EtaNote): EtaPart => ({ kind: "note", note: value });
const time = (value: string): EtaPart => ({ kind: "time", time: value });
const weekday = (value: number): EtaPart => ({ kind: "weekday", weekday: value });

export const shipmentSources = [
  {
    id: "SDA-01-2401",
    customer: customerAccounts.techCorp,
    origin: places.cgk,
    destination: places.sin,
    handling: { label: "fragileElectronics", tags: ["doNotStack", "keepUpright", "signatureRequired"] },
    weightKg: 2450,
    eta: time("08:45"),
    etaMeta: note("today"),
    status: "inTransit",
    progress: 65,
    mode: "air",
    routeType: "flight",
    transportNumber: "GA-884",
  },
  {
    id: "SDA-02-2402",
    customer: customerAccounts.regionalRoadExpress,
    origin: places.surabaya,
    destination: places.semarang,
    handling: { label: "heavyMachinery", tags: ["forkliftOnly", "secureLoad", "doNotTip"] },
    weightKg: 8120,
    eta: time("11:20"),
    etaMeta: note("tomorrow"),
    status: "delayed",
    progress: 42,
    mode: "land",
    routeType: "road",
    transportNumber: "B 9042 KX",
  },
  {
    id: "SDA-03-2403",
    customer: customerAccounts.sendWell,
    origin: places.tanjungPriok,
    destination: places.singaporePort,
    handling: { label: "temperatureControlled", tags: ["temperatureLog", "keepFrozen", "sealIntact"] },
    weightKg: 19800,
    eta: time("21:15"),
    etaMeta: note("deliveredYesterday"),
    status: "delivered",
    progress: 100,
    mode: "sea",
    routeType: "ship",
    transportNumber: "MV SEA-318",
  },
  {
    id: "SDA-04-2404",
    customer: customerAccounts.maersk,
    origin: places.kul,
    destination: places.bkk,
    handling: { label: "temperatureControlled", tags: ["temperatureLog", "keepUpright", "signatureRequired"] },
    weightKg: 540,
    eta: time("18:10"),
    etaMeta: note("today"),
    status: "onHold",
    progress: 28,
    mode: "air",
    routeType: "flight",
    transportNumber: "MH-728",
  },
  {
    id: "SDA-05-2405",
    customer: customerAccounts.sourceDay,
    origin: places.bandung,
    destination: places.yogyakarta,
    handling: { label: "standardFreight", tags: ["keepDry", "doNotCrush", "standardHandoff"] },
    weightKg: 1380,
    eta: time("09:30"),
    etaMeta: weekday(5),
    status: "scheduled",
    progress: 12,
    mode: "land",
    routeType: "road",
    transportNumber: "D 1284 YA",
  },
  {
    id: "SDA-06-2406",
    customer: customerAccounts.logisticsPlus,
    origin: places.portKlang,
    destination: places.laemChabang,
    handling: { label: "heavyBulk", tags: ["heavyLift", "secureLoad", "doNotStack"] },
    weightKg: 27400,
    eta: time("15:40"),
    etaMeta: note("departingToday"),
    status: "scheduled",
    progress: 18,
    mode: "sea",
    routeType: "ship",
    transportNumber: "MV LC-204",
  },
  {
    id: "SDA-07-2407",
    customer: customerAccounts.flexport,
    origin: places.hkg,
    destination: places.mnl,
    handling: { label: "sensitiveMedical", tags: ["sealIntact", "keepUpright", "signatureRequired"] },
    weightKg: 860,
    eta: note("pending"),
    etaMeta: note("customs"),
    status: "customsHold",
    progress: 33,
    mode: "air",
    routeType: "flight",
    transportNumber: "CX-901",
  },
  {
    id: "SDA-08-2408",
    customer: customerAccounts.shippingEasy,
    origin: places.jakarta,
    destination: places.bandung,
    handling: { label: "standardFreight", tags: ["keepDry", "callBeforeDelivery", "standardHandoff"] },
    weightKg: 620,
    eta: time("14:15"),
    etaMeta: note("today"),
    status: "outForDelivery",
    progress: 88,
    mode: "land",
    routeType: "road",
    transportNumber: "B 7712 JKT",
  },
  {
    id: "SDA-09-2409",
    customer: customerAccounts.freightView,
    origin: places.shanghai,
    destination: places.busan,
    handling: { label: "industrialParts", tags: ["secureLoad", "keepDry", "forkliftOnly"] },
    weightKg: 12200,
    eta: time("17:50"),
    etaMeta: weekday(3),
    status: "inTransit",
    progress: 54,
    mode: "sea",
    routeType: "ship",
    transportNumber: "MV BUSAN-54",
  },
  {
    id: "SDA-10-2410",
    customer: customerAccounts.techCorp,
    origin: places.nrt,
    destination: places.icn,
    handling: { label: "highValueFragile", tags: ["doNotStack", "keepUpright", "signatureRequired"] },
    weightKg: 320,
    eta: time("20:30"),
    etaMeta: note("deliveredYesterday"),
    status: "delivered",
    progress: 100,
    mode: "air",
    routeType: "flight",
    transportNumber: "KE-704",
  },
  {
    id: "SDA-11-2411",
    customer: customerAccounts.sourceDay,
    origin: places.kualaLumpur,
    destination: places.penang,
    handling: { label: "foodGrade", tags: ["foodGrade", "sealIntact", "keepDry"] },
    weightKg: 3950,
    eta: time("13:05"),
    etaMeta: note("today"),
    status: "inTransit",
    progress: 71,
    mode: "land",
    routeType: "road",
    transportNumber: "WQH 2184",
  },
  {
    id: "SDA-12-2412",
    customer: customerAccounts.transvirtual,
    origin: places.cebu,
    destination: places.davao,
    handling: { label: "perishable", tags: ["perishable", "ventilatedHold", "inspectOnArrival"] },
    weightKg: 6700,
    eta: time("09:40"),
    etaMeta: weekday(5),
    status: "delayed",
    progress: 39,
    mode: "sea",
    routeType: "ship",
    transportNumber: "MV DAVAO-12",
  },
  {
    id: "SDA-13-2413",
    customer: customerAccounts.flexport,
    origin: places.sin,
    destination: places.dps,
    handling: { label: "highValue", tags: ["highValue", "doNotStack", "signatureRequired"] },
    weightKg: 210,
    eta: time("07:15"),
    etaMeta: weekday(1),
    status: "scheduled",
    progress: 9,
    mode: "air",
    routeType: "flight",
    transportNumber: "SQ-938",
  },
  {
    id: "SDA-14-2414",
    customer: customerAccounts.sendWell,
    origin: places.manilaPort,
    destination: places.tanjungPriok,
    handling: { label: "moistureSensitive", tags: ["keepDry", "doNotTip", "forkliftOnly"] },
    weightKg: 15900,
    eta: note("awaitingRelease"),
    etaMeta: note("warehouse"),
    status: "onHold",
    progress: 25,
    mode: "sea",
    routeType: "ship",
    transportNumber: "MV PRI-77",
  },
  {
    id: "SDA-15-2415",
    customer: customerAccounts.skyTrack,
    origin: places.medan,
    destination: places.pekanbaru,
    handling: { label: "standardPalletized", tags: ["keepUpright", "doNotStack", "standardHandoff"] },
    weightKg: 4500,
    eta: time("15:30"),
    etaMeta: note("today"),
    status: "scheduled",
    progress: 16,
    mode: "land",
    routeType: "road",
    transportNumber: "BK 4520 RA",
  },
  {
    id: "SDA-16-2416",
    customer: customerAccounts.regionalRoadExpress,
    origin: places.bom,
    destination: places.del,
    handling: { label: "industrialParts", tags: ["secureLoad", "forkliftOnly", "inspectOnArrival"] },
    weightKg: 780,
    eta: time("16:10"),
    etaMeta: note("today"),
    status: "outForDelivery",
    progress: 84,
    mode: "air",
    routeType: "flight",
    transportNumber: "AI-864",
  },
  {
    id: "SDA-17-2417",
    customer: customerAccounts.logisticsPlus,
    origin: places.rotterdam,
    destination: places.hamburg,
    handling: { label: "standardFreight", tags: ["keepDry", "countOnArrival", "standardHandoff"] },
    weightKg: 21300,
    eta: note("nextWeek"),
    etaMeta: weekday(2),
    status: "inTransit",
    progress: 62,
    mode: "sea",
    routeType: "ship",
    transportNumber: "MV HAM-902",
  },
  {
    id: "SDA-18-2418",
    customer: customerAccounts.transvirtual,
    origin: places.hoChiMinhCity,
    destination: places.daNang,
    handling: { label: "fragileBulky", tags: ["keepUpright", "doNotStack", "twoPersonLift"] },
    weightKg: 2060,
    eta: time("11:40"),
    etaMeta: note("deliveredToday"),
    status: "delivered",
    progress: 100,
    mode: "land",
    routeType: "road",
    transportNumber: "51C-208.44",
  },
  {
    id: "SDA-19-2419",
    customer: customerAccounts.maersk,
    origin: places.dxb,
    destination: places.jed,
    handling: { label: "temperatureControlled", tags: ["temperatureLog", "keepUpright", "escalateDelay"] },
    weightKg: 1120,
    eta: time("22:50"),
    etaMeta: note("tonight"),
    status: "delayed",
    progress: 47,
    mode: "air",
    routeType: "flight",
    transportNumber: "SV-591",
  },
  {
    id: "SDA-20-2420",
    customer: customerAccounts.freightView,
    origin: places.nhavaSheva,
    destination: places.colombo,
    handling: { label: "heavyBulk", tags: ["heavyLift", "secureLoad", "doNotTip"] },
    weightKg: 31800,
    eta: time("06:00"),
    etaMeta: weekday(4),
    status: "scheduled",
    progress: 14,
    mode: "sea",
    routeType: "ship",
    transportNumber: "MV COL-620",
  },
  {
    id: "SDA-21-2421",
    customer: customerAccounts.piedPiper,
    origin: places.chiangMai,
    destination: places.bangkok,
    handling: { label: "fragileBulky", tags: ["doNotStack", "keepDry", "twoPersonLift"] },
    weightKg: 5240,
    eta: time("08:20"),
    etaMeta: note("tomorrow"),
    status: "inTransit",
    progress: 58,
    mode: "land",
    routeType: "road",
    transportNumber: "กท 8842",
  },
  {
    id: "SDA-22-2422",
    customer: customerAccounts.techCorp,
    origin: places.kix,
    destination: places.tpe,
    handling: { label: "highValuePrecision", tags: ["securityHold", "sealIntact", "signatureRequired"] },
    weightKg: 430,
    eta: note("pending"),
    etaMeta: note("security"),
    status: "onHold",
    progress: 29,
    mode: "air",
    routeType: "flight",
    transportNumber: "BR-129",
  },
  {
    id: "SDA-23-2423",
    customer: customerAccounts.maersk,
    origin: places.singaporePort,
    destination: places.portKlang,
    handling: { label: "hazmatReview", tags: ["hazmatReview", "keepUpright", "restrictedHandling"] },
    weightKg: 18600,
    eta: note("departing"),
    etaMeta: time("14:50"),
    status: "scheduled",
    progress: 19,
    mode: "sea",
    routeType: "ship",
    transportNumber: "MV PKG-315",
  },
  {
    id: "SDA-24-2424",
    customer: customerAccounts.shippingEasy,
    origin: places.bandarLampung,
    destination: places.jakarta,
    handling: { label: "perishable", tags: ["perishable", "ventilatedHold", "inspectOnArrival"] },
    weightKg: 970,
    eta: time("18:20"),
    etaMeta: note("deliveredToday"),
    status: "delivered",
    progress: 100,
    mode: "land",
    routeType: "road",
    transportNumber: "BE 1745 YU",
  },
] as const satisfies readonly ShipmentSource[];

export type ShipmentId = (typeof shipmentSources)[number]["id"];
