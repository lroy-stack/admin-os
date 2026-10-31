import "server-only";

import type { VerticalId } from "@/config/vertical";
import { defineMessages } from "@/core/i18n";

/** Names of the presets in the demo switch. Keyed by preset id, so a new preset fails to compile until it is named. */
export type DemoMessages = Readonly<Record<VerticalId, string>>;

export const demoMessages = defineMessages<DemoMessages>({
  en: { hospitality: "Hospitality", salon: "Salon", workshop: "Workshop" },
  es: { hospitality: "Hostelería", salon: "Peluquería", workshop: "Taller" },
  de: { hospitality: "Gastronomie", salon: "Friseursalon", workshop: "Werkstatt" },
  fr: { hospitality: "Restauration", salon: "Salon de coiffure", workshop: "Atelier" },
});
