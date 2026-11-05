import "server-only";

import type { ClockSeed } from "@/core/clock";
import type { Terms, Vocabulary } from "@/core/i18n";

import { BUSINESS_DAY } from "./seed";

export { salonSeed } from "./seed";

/** A late-morning moment in a salon day. Seeded so server and client render the same moment (ADR 0005). */
export const salonClock: ClockSeed = {
  businessDay: BUSINESS_DAY,
  nowMin: 11 * 60,
  cutoffMin: 0,
  timeZone: "Europe/Madrid",
};

export const salonVocabulary = {
  "bookings.title": { en: "Appointments", es: "Citas", de: "Termine", fr: "Rendez-vous" },
  "bookings.count": {
    en: { one: "{count} appointment", other: "{count} appointments" },
    es: { one: "{count} cita", other: "{count} citas" },
    de: { one: "{count} Termin", other: "{count} Termine" },
    fr: { one: "{count} rendez-vous", other: "{count} rendez-vous" },
  },
  "customers.title": { en: "Clients", es: "Clientes", de: "Kundschaft", fr: "Clients" },
  "customers.count": {
    en: { one: "{count} client", other: "{count} clients" },
    es: { one: "{count} cliente", other: "{count} clientes" },
    de: { one: "{count} Kunde", other: "{count} Kunden" },
    fr: { one: "{count} client", other: "{count} clients" },
  },
  "resources.title": { en: "Chairs", es: "Sillones", de: "Frisierplätze", fr: "Fauteuils" },
  "resources.count": {
    en: { one: "{count} chair", other: "{count} chairs" },
    es: { one: "{count} sillón", other: "{count} sillones" },
    de: { one: "{count} Frisierplatz", other: "{count} Frisierplätze" },
    fr: { one: "{count} fauteuil", other: "{count} fauteuils" },
  },
  "resources.kind": { en: "Chair", es: "Sillón", de: "Frisierplatz", fr: "Fauteuil" },
  "staff.title": { en: "Stylists", es: "Estilistas", de: "Stylisten", fr: "Stylistes" },
  "staff.count": {
    en: { one: "{count} stylist", other: "{count} stylists" },
    es: { one: "{count} estilista", other: "{count} estilistas" },
    de: { one: "{count} Stylist", other: "{count} Stylisten" },
    fr: { one: "{count} styliste", other: "{count} stylistes" },
  },
  "catalog.title": { en: "Services", es: "Servicios", de: "Leistungen", fr: "Prestations" },
  "catalog.count": {
    en: { one: "{count} service", other: "{count} services" },
    es: { one: "{count} servicio", other: "{count} servicios" },
    de: { one: "{count} Leistung", other: "{count} Leistungen" },
    fr: { one: "{count} prestation", other: "{count} prestations" },
  },
  "access.roles.staff": { en: "Stylist", es: "Estilista", de: "Stylist", fr: "Styliste" },
} as const satisfies Vocabulary;

/**
 * The words for the data this preset's business types, keyed by family and id as the data holds it. The skills are the
 * ones its seed gives the team; an id with no words here shows as typed (`termLabel`).
 */
export const salonTerms = {
  skills: {
    cut: { en: "Cut", es: "Corte", de: "Schnitt", fr: "Coupe" },
    colour: { en: "Colour", es: "Color", de: "Farbe", fr: "Couleur" },
  },
} as const satisfies Terms;
