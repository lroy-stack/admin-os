import "server-only";

import { defineMessages, type MessageBundle } from "@/core/i18n";

import { type DashboardMessages, dashboardMessageKey } from "./messages";

const en: DashboardMessages = {
  openStandalone: "Open as a standalone page",
  deal: {
    closes: "Closes {date}",
    moreActions: "More actions for {title}",
    stageProbability: "{stage} · {probability}",
  },
  stages: {
    qualification: "Qualification",
    proposal: "Proposal",
    negotiation: "Negotiation",
    closing: "Closing",
    won: "Won",
    lost: "Lost",
  },
};

const es: DashboardMessages = {
  openStandalone: "Abrir como página independiente",
  deal: {
    closes: "Cierra el {date}",
    moreActions: "Más acciones para {title}",
    stageProbability: "{stage} · {probability}",
  },
  stages: {
    qualification: "Cualificación",
    proposal: "Propuesta",
    negotiation: "Negociación",
    closing: "Cierre",
    won: "Ganado",
    lost: "Perdido",
  },
};

const de: DashboardMessages = {
  openStandalone: "Als eigenständige Seite öffnen",
  deal: {
    closes: "Abschluss am {date}",
    moreActions: "Weitere Aktionen für {title}",
    stageProbability: "{stage} · {probability}",
  },
  stages: {
    qualification: "Qualifizierung",
    proposal: "Angebot",
    negotiation: "Verhandlung",
    closing: "Abschluss",
    won: "Gewonnen",
    lost: "Verloren",
  },
};

const fr: DashboardMessages = {
  openStandalone: "Ouvrir en page autonome",
  deal: {
    closes: "Clôture le {date}",
    moreActions: "Plus d’actions pour {title}",
    stageProbability: "{stage} · {probability}",
  },
  stages: {
    qualification: "Qualification",
    proposal: "Proposition",
    negotiation: "Négociation",
    closing: "Conclusion",
    won: "Gagnée",
    lost: "Perdue",
  },
};

export const dashboardMessages = defineMessages<DashboardMessages>({ en, es, de, fr });

/** Pass to the dashboard layout's `LocaleRoot`. */
export const dashboardBundle: MessageBundle<DashboardMessages> = {
  key: dashboardMessageKey,
  dictionary: dashboardMessages,
};
