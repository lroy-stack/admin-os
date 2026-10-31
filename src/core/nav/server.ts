import "server-only";

import { defineMessages } from "@/core/i18n";

export interface NavigationMessages {
  /** The landing area every preset starts with. */
  readonly home: string;
  /** Labels of the preset groups (`NavEntry.group`), used where entries are grouped, such as the search dialog. */
  readonly groups: {
    readonly overview: string;
    readonly operations: string;
  };
}

/** Kernel messages of the navigation; a preset vocabulary may override any of them (`nav.home`). */
export const navigationMessages = defineMessages<NavigationMessages>({
  en: { home: "Home", groups: { overview: "Overview", operations: "Operations" } },
  es: { home: "Inicio", groups: { overview: "Resumen", operations: "Operaciones" } },
  de: { home: "Start", groups: { overview: "Übersicht", operations: "Betrieb" } },
  fr: { home: "Accueil", groups: { overview: "Aperçu", operations: "Exploitation" } },
});
