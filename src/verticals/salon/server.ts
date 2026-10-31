import "server-only";

import type { Vocabulary } from "@/core/i18n";

export { salonSeed } from "./seed";

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
