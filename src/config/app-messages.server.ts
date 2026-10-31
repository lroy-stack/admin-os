import "server-only";

import { cache } from "react";

import { defineMessages, format, type PageMeta } from "@/core/i18n";

import { getLocale } from "./locale.server";

/** App-wide text outside any one screen: the default page metadata and the footer line. */
interface AppMessages {
  /** The landing page's metadata and the fallback for pages without their own. */
  readonly meta: PageMeta;
  /** Placeholders: `{year}`. */
  readonly copyright: string;
}

const en: AppMessages = {
  meta: {
    title: "admin-OS: open-source management dashboard for small businesses",
    description:
      "MIT-licensed management dashboard for restaurants, salons and workshops: bookings with a live floor plan, customers, team, catalog and messaging. Built with Next.js, shadcn/ui and liquid glass.",
  },
  copyright: "© {year} admin-OS. Open source under the MIT license.",
};

const es: AppMessages = {
  meta: {
    title: "admin-OS: panel de gestión de código abierto para pequeños negocios",
    description:
      "Panel de gestión con licencia MIT para restaurantes, salones y talleres: reservas con plano de sala en vivo, clientes, equipo, catálogo y mensajería. Creado con Next.js, shadcn/ui y liquid glass.",
  },
  copyright: "© {year} admin-OS. Código abierto bajo licencia MIT.",
};

const de: AppMessages = {
  meta: {
    title: "admin-OS: Open-Source-Verwaltungsdashboard für kleine Unternehmen",
    description:
      "Verwaltungsdashboard unter MIT-Lizenz für Restaurants, Salons und Werkstätten: Reservierungen mit Live-Raumplan, Kunden, Team, Katalog und Nachrichten. Entwickelt mit Next.js, shadcn/ui und Liquid Glass.",
  },
  copyright: "© {year} admin-OS. Open Source unter der MIT-Lizenz.",
};

const fr: AppMessages = {
  meta: {
    title: "admin-OS : tableau de bord de gestion open source pour petites entreprises",
    description:
      "Tableau de bord de gestion sous licence MIT pour restaurants, salons et ateliers : réservations avec plan de salle en direct, clients, équipe, catalogue et messagerie. Conçu avec Next.js, shadcn/ui et liquid glass.",
  },
  copyright: "© {year} admin-OS. Logiciel libre sous licence MIT.",
};

export const appMessages = defineMessages<AppMessages>({ en, es, de, fr });

/** The footer line for this request's locale, for the current year. */
export const getCopyright = cache(async () => {
  const locale = await getLocale();
  return format(appMessages[locale].copyright, locale, { year: new Date().getFullYear() });
});
