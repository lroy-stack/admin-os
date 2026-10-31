/**
 * Mock bookings for one dinner service. Times are minutes from midnight and "now" is fixed,
 * so server and client renders match and the screen always shows a busy mid-service moment.
 */

export const SERVICE_DATE = "2026-10-31";
export const SERVICE_NOW_MIN = 20 * 60 + 40;
export const SERVICE_WINDOW = { startMin: 19 * 60, endMin: 24 * 60 } as const;
/** A confirmed party counts as running late this many minutes after its arrival time. */
export const LATE_AFTER_MIN = 10;

export type ReservationStatus = "pending" | "confirmed" | "seated" | "completed" | "cancelled" | "no_show";

export type Channel = "web" | "phone" | "walk-in" | "assistant";

/** Short labels under the guest name: diet, occasion, service notes. The text lives in the dictionary. */
export type TagId =
  | "askedBill"
  | "regular"
  | "glutenFree"
  | "anniversary"
  | "lactoseFree"
  | "birthdayCake"
  | "stroller"
  | "quietTable"
  | "companyDinner";

/** Booking notes of the demo data; real notes are free text the guest or the host wrote. */
export type NoteId =
  | "coeliacGuest"
  | "dessertCandle"
  | "cakeWithCoffee"
  | "strollerSpace"
  | "quietCorner"
  | "setMenu"
  | "cancelledByGuest";

export type AllergyId = "glutenAllergy" | "lactoseAllergy" | "nutsOneGuest";

/** The language a guest speaks, as a code the dictionary names. */
export type GuestLanguage = "es" | "en" | "ca" | "de";

export type GuestProfile = {
  visits: number;
  /** In the business currency, in major units. */
  averageSpend: number;
  /** Days since the last visit: 0 is today, null is a first visit. */
  lastVisitDaysAgo: number | null;
  language: GuestLanguage | null;
  allergy: AllergyId | null;
};

export type Reservation = {
  id: string;
  /** A surname (a proper noun). Empty for a walk-in, which the screen names in the active language. */
  guest: string;
  partySize: number;
  startMin: number;
  endMin: number;
  status: ReservationStatus;
  tableIds: string[];
  channel: Channel;
  tags: TagId[];
  note: NoteId | null;
  profile: GuestProfile;
};

const at = (hours: number, minutes = 0) => hours * 60 + minutes;

const firstVisit: GuestProfile = {
  visits: 1,
  averageSpend: 0,
  lastVisitDaysAgo: null,
  language: "es",
  allergy: null,
};

export const serviceReservations: Reservation[] = [
  {
    id: "R-1041",
    guest: "Iglesias",
    partySize: 2,
    startMin: at(19),
    endMin: at(20, 30),
    status: "seated",
    tableIds: ["S2"],
    channel: "web",
    tags: ["askedBill", "regular"],
    note: null,
    profile: { visits: 14, averageSpend: 58, lastVisitDaysAgo: 14, language: "es", allergy: null },
  },
  {
    id: "R-1042",
    guest: "Mora",
    partySize: 4,
    startMin: at(19),
    endMin: at(20, 45),
    status: "seated",
    tableIds: ["T6"],
    channel: "web",
    tags: [],
    note: null,
    profile: { visits: 3, averageSpend: 41, lastVisitDaysAgo: 60, language: "es", allergy: null },
  },
  {
    id: "R-1043",
    guest: "Ortega",
    partySize: 4,
    startMin: at(19, 15),
    endMin: at(21),
    status: "seated",
    tableIds: ["S3"],
    channel: "phone",
    tags: ["glutenFree"],
    note: "coeliacGuest",
    profile: { visits: 6, averageSpend: 52, lastVisitDaysAgo: 30, language: "es", allergy: "glutenAllergy" },
  },
  {
    id: "R-1044",
    guest: "Valdés",
    partySize: 2,
    startMin: at(19, 30),
    endMin: at(21),
    status: "seated",
    tableIds: ["T2"],
    channel: "web",
    tags: ["glutenFree", "anniversary"],
    note: "dessertCandle",
    profile: { visits: 2, averageSpend: 67, lastVisitDaysAgo: 365, language: "es", allergy: "glutenAllergy" },
  },
  {
    id: "R-1045",
    guest: "Sanz",
    partySize: 3,
    startMin: at(20),
    endMin: at(21, 45),
    status: "seated",
    tableIds: ["T7"],
    channel: "web",
    tags: [],
    note: null,
    profile: { visits: 5, averageSpend: 44, lastVisitDaysAgo: 21, language: "es", allergy: null },
  },
  {
    id: "R-1046",
    guest: "Castaño",
    partySize: 2,
    startMin: at(20, 15),
    endMin: at(21, 45),
    status: "confirmed",
    tableIds: ["T8"],
    channel: "web",
    tags: [],
    note: null,
    profile: { visits: 4, averageSpend: 49, lastVisitDaysAgo: 35, language: "es", allergy: null },
  },
  {
    id: "R-1047",
    guest: "",
    partySize: 2,
    startMin: at(20, 20),
    endMin: at(21, 50),
    status: "seated",
    tableIds: ["T1"],
    channel: "walk-in",
    tags: [],
    note: null,
    profile: firstVisit,
  },
  {
    id: "R-1048",
    guest: "Bravo",
    partySize: 4,
    startMin: at(20, 30),
    endMin: at(22, 15),
    status: "confirmed",
    tableIds: ["S5"],
    channel: "phone",
    tags: ["lactoseFree"],
    note: null,
    profile: { visits: 8, averageSpend: 61, lastVisitDaysAgo: 7, language: "es", allergy: "lactoseAllergy" },
  },
  {
    id: "R-1049",
    guest: "Peña",
    partySize: 2,
    startMin: at(20, 45),
    endMin: at(22, 15),
    status: "confirmed",
    tableIds: ["B1"],
    channel: "web",
    tags: [],
    note: null,
    profile: { visits: 1, averageSpend: 38, lastVisitDaysAgo: 90, language: "en", allergy: null },
  },
  {
    id: "R-1050",
    guest: "Cano",
    partySize: 4,
    startMin: at(20, 45),
    endMin: at(22, 30),
    status: "confirmed",
    tableIds: ["S7"],
    channel: "web",
    tags: ["birthdayCake"],
    note: "cakeWithCoffee",
    profile: { visits: 2, averageSpend: 55, lastVisitDaysAgo: 180, language: "es", allergy: null },
  },
  {
    id: "R-1051",
    guest: "Ruiz",
    partySize: 4,
    startMin: at(21),
    endMin: at(22, 45),
    status: "confirmed",
    tableIds: ["S1"],
    channel: "web",
    tags: ["regular"],
    note: null,
    profile: { visits: 9, averageSpend: 63, lastVisitDaysAgo: 21, language: "en", allergy: null },
  },
  {
    id: "R-1052",
    guest: "Soto",
    partySize: 6,
    startMin: at(21),
    endMin: at(23),
    status: "confirmed",
    tableIds: ["S6"],
    channel: "phone",
    tags: ["stroller"],
    note: "strollerSpace",
    profile: { visits: 3, averageSpend: 47, lastVisitDaysAgo: 120, language: "es", allergy: null },
  },
  {
    id: "R-1053",
    guest: "Ferrer",
    partySize: 2,
    startMin: at(21),
    endMin: at(22, 30),
    status: "confirmed",
    tableIds: ["T4"],
    channel: "web",
    tags: [],
    note: null,
    profile: { visits: 1, averageSpend: 0, lastVisitDaysAgo: null, language: "ca", allergy: null },
  },
  {
    id: "R-1054",
    guest: "Lozano",
    partySize: 2,
    startMin: at(21),
    endMin: at(22, 30),
    status: "confirmed",
    tableIds: ["T5"],
    channel: "assistant",
    tags: ["glutenFree"],
    note: null,
    profile: { visits: 2, averageSpend: 42, lastVisitDaysAgo: 60, language: "es", allergy: "glutenAllergy" },
  },
  {
    id: "R-1055",
    guest: "Rey",
    partySize: 4,
    startMin: at(21, 15),
    endMin: at(22, 45),
    status: "confirmed",
    tableIds: [],
    channel: "phone",
    tags: ["quietTable"],
    note: "quietCorner",
    profile: { visits: 5, averageSpend: 50, lastVisitDaysAgo: 30, language: "es", allergy: null },
  },
  {
    id: "R-1056",
    guest: "Cabrera",
    partySize: 4,
    startMin: at(21, 15),
    endMin: at(23),
    status: "confirmed",
    tableIds: ["T3"],
    channel: "web",
    tags: [],
    note: null,
    profile: { visits: 2, averageSpend: 39, lastVisitDaysAgo: 240, language: "de", allergy: null },
  },
  {
    id: "R-1057",
    guest: "Marín",
    partySize: 2,
    startMin: at(21, 30),
    endMin: at(23),
    status: "pending",
    tableIds: ["S4"],
    channel: "web",
    tags: [],
    note: null,
    profile: firstVisit,
  },
  {
    id: "R-1058",
    guest: "Blanco",
    partySize: 3,
    startMin: at(22),
    endMin: at(23, 30),
    status: "confirmed",
    tableIds: ["T7"],
    channel: "web",
    tags: [],
    note: null,
    profile: { visits: 6, averageSpend: 46, lastVisitDaysAgo: 14, language: "es", allergy: null },
  },
  {
    id: "R-1059",
    guest: "Calvo",
    partySize: 8,
    startMin: at(22),
    endMin: at(24),
    status: "pending",
    tableIds: [],
    channel: "phone",
    tags: ["companyDinner"],
    note: "setMenu",
    profile: {
      visits: 1,
      averageSpend: 0,
      lastVisitDaysAgo: null,
      language: "es",
      allergy: "nutsOneGuest",
    },
  },
  {
    id: "R-1060",
    guest: "Lara",
    partySize: 2,
    startMin: at(22, 30),
    endMin: at(24),
    status: "confirmed",
    tableIds: ["S2"],
    channel: "web",
    tags: [],
    note: null,
    profile: { visits: 3, averageSpend: 52, lastVisitDaysAgo: 30, language: "es", allergy: null },
  },
  {
    id: "R-1061",
    guest: "Navarro",
    partySize: 2,
    startMin: at(19),
    endMin: at(20, 15),
    status: "completed",
    tableIds: ["B2"],
    channel: "web",
    tags: [],
    note: null,
    profile: { visits: 11, averageSpend: 35, lastVisitDaysAgo: 0, language: "es", allergy: null },
  },
  {
    id: "R-1062",
    guest: "Vidal",
    partySize: 2,
    startMin: at(20),
    endMin: at(21, 30),
    status: "cancelled",
    tableIds: [],
    channel: "web",
    tags: [],
    note: "cancelledByGuest",
    profile: { visits: 2, averageSpend: 44, lastVisitDaysAgo: 150, language: "es", allergy: null },
  },
  {
    id: "R-1063",
    guest: "Herrera",
    partySize: 3,
    startMin: at(19, 45),
    endMin: at(21, 15),
    status: "no_show",
    tableIds: [],
    channel: "phone",
    tags: [],
    note: null,
    profile: firstVisit,
  },
];
