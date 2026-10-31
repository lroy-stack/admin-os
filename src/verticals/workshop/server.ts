import "server-only";

import type { Vocabulary } from "@/core/i18n";

export { workshopSeed } from "./seed";

export const workshopVocabulary = {
  "bookings.title": {
    en: "Drop-off appointments",
    es: "Recepciones",
    de: "Annahmetermine",
    fr: "Rendez-vous de dépôt",
  },
  "bookings.count": {
    en: { one: "{count} drop-off appointment", other: "{count} drop-off appointments" },
    es: { one: "{count} recepción", other: "{count} recepciones" },
    de: { one: "{count} Annahmetermin", other: "{count} Annahmetermine" },
    fr: { one: "{count} rendez-vous de dépôt", other: "{count} rendez-vous de dépôt" },
  },
  "resources.title": { en: "Bays", es: "Boxes", de: "Werkstattplätze", fr: "Postes" },
  "resources.count": {
    en: { one: "{count} bay", other: "{count} bays" },
    es: { one: "{count} box", other: "{count} boxes" },
    de: { one: "{count} Werkstattplatz", other: "{count} Werkstattplätze" },
    fr: { one: "{count} poste", other: "{count} postes" },
  },
  "resources.kind": { en: "Bay", es: "Box", de: "Werkstattplatz", fr: "Poste" },
  "staff.title": { en: "Mechanics", es: "Mecánicos", de: "Mechaniker", fr: "Mécaniciens" },
  "staff.count": {
    en: { one: "{count} mechanic", other: "{count} mechanics" },
    es: { one: "{count} mecánico", other: "{count} mecánicos" },
    de: { one: "{count} Mechaniker", other: "{count} Mechaniker" },
    fr: { one: "{count} mécanicien", other: "{count} mécaniciens" },
  },
  "catalog.title": {
    en: "Parts and labour",
    es: "Piezas y mano de obra",
    de: "Material und Arbeitslohn",
    fr: "Pièces et main-d’œuvre",
  },
  "catalog.count": {
    en: { one: "{count} item", other: "{count} items" },
    es: { one: "{count} artículo", other: "{count} artículos" },
    de: { one: "{count} Position", other: "{count} Positionen" },
    fr: { one: "{count} article", other: "{count} articles" },
  },
  "access.roles.staff": { en: "Mechanic", es: "Mecánico", de: "Mechaniker", fr: "Mécanicien" },
} as const satisfies Vocabulary;
