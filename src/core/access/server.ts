import "server-only";

import { defineMessages } from "@/core/i18n";

export interface AccessMessages {
  readonly roles: {
    readonly owner: string;
    readonly manager: string;
    readonly staff: string;
  };
}

/** Default role labels; a preset vocabulary may rename them (`access.roles.staff`). */
export const accessMessages = defineMessages<AccessMessages>({
  en: { roles: { owner: "Owner", manager: "Manager", staff: "Staff" } },
  es: { roles: { owner: "Propietario", manager: "Encargado", staff: "Personal" } },
  de: { roles: { owner: "Inhaber", manager: "Leitung", staff: "Mitarbeitende" } },
  fr: { roles: { owner: "Propriétaire", manager: "Responsable", staff: "Personnel" } },
});
