import "server-only";

import type { ClockSeed } from "@/core/clock";
import type { Terms, Vocabulary } from "@/core/i18n";

import { BUSINESS_DAY } from "./seed";

export { hospitalitySeed } from "./seed";

/** Dinner service at 20:40; the business day turns over at 05:00 after late service. Seeded so server and client render the same moment (ADR 0005). */
export const hospitalityClock: ClockSeed = {
  businessDay: BUSINESS_DAY,
  nowMin: 20 * 60 + 40,
  cutoffMin: 5 * 60,
  timeZone: "Europe/Madrid",
};

export const hospitalityVocabulary = {
  "bookings.title": { en: "Reservations", es: "Reservas", de: "Reservierungen", fr: "Réservations" },
  "bookings.count": {
    en: { one: "{count} reservation", other: "{count} reservations" },
    es: { one: "{count} reserva", other: "{count} reservas" },
    de: { one: "{count} Reservierung", other: "{count} Reservierungen" },
    fr: { one: "{count} réservation", other: "{count} réservations" },
  },
  "bookings.partySize": { en: "Covers", es: "Comensales", de: "Gedecke", fr: "Couverts" },
  "customers.title": { en: "Guests", es: "Clientes", de: "Gäste", fr: "Clients" },
  "customers.count": {
    en: { one: "{count} guest", other: "{count} guests" },
    es: { one: "{count} cliente", other: "{count} clientes" },
    de: { one: "{count} Gast", other: "{count} Gäste" },
    fr: { one: "{count} client", other: "{count} clients" },
  },
  "resources.title": { en: "Tables", es: "Mesas", de: "Tische", fr: "Tables" },
  "resources.count": {
    en: { one: "{count} table", other: "{count} tables" },
    es: { one: "{count} mesa", other: "{count} mesas" },
    de: { one: "{count} Tisch", other: "{count} Tische" },
    fr: { one: "{count} table", other: "{count} tables" },
  },
  "resources.kind": { en: "Table", es: "Mesa", de: "Tisch", fr: "Table" },
  "staff.title": { en: "Team", es: "Equipo", de: "Team", fr: "Équipe" },
  "staff.count": {
    en: { one: "{count} team member", other: "{count} team members" },
    es: { one: "{count} miembro del equipo", other: "{count} miembros del equipo" },
    de: { one: "{count} Teammitglied", other: "{count} Teammitglieder" },
    fr: { one: "{count} membre de l’équipe", other: "{count} membres de l’équipe" },
  },
  "catalog.title": { en: "Menu", es: "Carta", de: "Speisekarte", fr: "Carte" },
  "catalog.count": {
    en: { one: "{count} dish", other: "{count} dishes" },
    es: { one: "{count} plato", other: "{count} platos" },
    de: { one: "{count} Gericht", other: "{count} Gerichte" },
    fr: { one: "{count} plat", other: "{count} plats" },
  },
} as const satisfies Vocabulary;

/**
 * The words for the data this preset's business types, keyed by family and id as the data holds it. The skills are the
 * ones its seed gives the team; an id with no words here shows as typed (`termLabel`).
 */
export const hospitalityTerms = {
  skills: {
    host: { en: "Host", es: "Anfitrión", de: "Empfang", fr: "Accueil" },
    sommelier: { en: "Sommelier", es: "Sumiller", de: "Sommelier", fr: "Sommelier" },
    waiter: { en: "Waiter", es: "Camarero", de: "Kellner", fr: "Serveur" },
    grill: { en: "Grill", es: "Parrilla", de: "Grill", fr: "Grill" },
    pastry: { en: "Pastry", es: "Repostería", de: "Konditorei", fr: "Pâtisserie" },
  },
} as const satisfies Terms;
