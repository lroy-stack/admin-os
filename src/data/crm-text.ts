import type { Locale } from "@/core/i18n/client";

import type { Deal } from "./crm";

/**
 * Demo content in the other languages (spec D5): deal titles are text a business writes in its own language, so the
 * demo shows them translated. `Deal.title` in `crm.ts` is the English source and the key; people, companies and
 * product codes are proper nouns and stay as they are. The server resolves a locale before data reaches a client.
 */
type Translations = Readonly<Record<Exclude<Locale, "en">, string>>;

const dealTitleTranslations: Readonly<Record<string, Translations>> = {
  "Solar carport canopy": {
    es: "Marquesina solar para aparcamiento",
    de: "Solar-Carport-Überdachung",
    fr: "Ombrière solaire de parking",
  },
  "Solar carport, 40 bays": {
    es: "Marquesina solar, 40 plazas",
    de: "Solar-Carport, 40 Stellplätze",
    fr: "Ombrière solaire, 40 places",
  },
  "Multi-site rollout": {
    es: "Despliegue multisede",
    de: "Rollout an mehreren Standorten",
    fr: "Déploiement multisite",
  },
  "Inverter replacement": {
    es: "Sustitución de inversores",
    de: "Austausch der Wechselrichter",
    fr: "Remplacement des onduleurs",
  },
  "LED lighting upgrade": {
    es: "Modernización de la iluminación LED",
    de: "Modernisierung der LED-Beleuchtung",
    fr: "Modernisation de l’éclairage LED",
  },
  "Energy audit & design": {
    es: "Auditoría energética y diseño",
    de: "Energieaudit und Planung",
    fr: "Audit énergétique et conception",
  },
  "Rooftop array, 45 kW": {
    es: "Instalación en cubierta, 45 kW",
    de: "Aufdachanlage, 45 kW",
    fr: "Centrale en toiture, 45 kW",
  },
  "Rooftop array, 60 kW": {
    es: "Instalación en cubierta, 60 kW",
    de: "Aufdachanlage, 60 kW",
    fr: "Centrale en toiture, 60 kW",
  },
  "Rooftop array, 90 kW": {
    es: "Instalación en cubierta, 90 kW",
    de: "Aufdachanlage, 90 kW",
    fr: "Centrale en toiture, 90 kW",
  },
  "Rooftop array, 120 kW": {
    es: "Instalación en cubierta, 120 kW",
    de: "Aufdachanlage, 120 kW",
    fr: "Centrale en toiture, 120 kW",
  },
  "Rooftop array, 240 kW": {
    es: "Instalación en cubierta, 240 kW",
    de: "Aufdachanlage, 240 kW",
    fr: "Centrale en toiture, 240 kW",
  },
  "Battery storage retrofit": {
    es: "Ampliación con almacenamiento en baterías",
    de: "Nachrüstung eines Batteriespeichers",
    fr: "Ajout d’un stockage par batteries",
  },
  "Ground mount, 1.2 MW": {
    es: "Planta en suelo, 1,2 MW",
    de: "Freiflächenanlage, 1,2 MW",
    fr: "Centrale au sol, 1,2 MW",
  },
  "Heat pump retrofit": {
    es: "Instalación de bomba de calor",
    de: "Nachrüstung einer Wärmepumpe",
    fr: "Installation d’une pompe à chaleur",
  },
  "EV charging, 4 bays": {
    es: "Carga para vehículos eléctricos, 4 plazas",
    de: "E-Ladestationen, 4 Stellplätze",
    fr: "Bornes de recharge, 4 places",
  },
  "EV charging, 6 bays": {
    es: "Carga para vehículos eléctricos, 6 plazas",
    de: "E-Ladestationen, 6 Stellplätze",
    fr: "Bornes de recharge, 6 places",
  },
  "EV charging hub, 12 bays": {
    es: "Hub de carga para vehículos eléctricos, 12 plazas",
    de: "E-Ladepark, 12 Stellplätze",
    fr: "Station de recharge, 12 places",
  },
  "Service contract, 3 yr": {
    es: "Contrato de servicio, 3 años",
    de: "Servicevertrag, 3 Jahre",
    fr: "Contrat de service, 3 ans",
  },
  "Maintenance plan, 5 yr": {
    es: "Plan de mantenimiento, 5 años",
    de: "Wartungsplan, 5 Jahre",
    fr: "Plan de maintenance, 5 ans",
  },
  "Battery backup system": {
    es: "Sistema de baterías de respaldo",
    de: "Batterie-Notstromsystem",
    fr: "Système de batteries de secours",
  },
};

/** The titles with a translation, for the test that every deal in `crm.ts` is covered. */
export const translatedDealTitles: readonly string[] = Object.keys(dealTitleTranslations);

export function localizeDealTitle(title: string, locale: Locale): string {
  if (locale === "en") {
    return title;
  }
  const translations = dealTitleTranslations[title];
  if (!translations) {
    throw new Error(`No ${locale} translation for the demo deal "${title}"; add it to src/data/crm-text.ts`);
  }
  return translations[locale];
}

/** The deals with their titles in one locale. Call on the server, before the deals reach a client component. */
export function localizeDeals<T extends Deal>(deals: readonly T[], locale: Locale): T[] {
  return deals.map((deal) => ({ ...deal, title: localizeDealTitle(deal.title, locale) }));
}
