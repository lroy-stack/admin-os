import { defineMessages, type ErrorMessages, type Plural } from "@/core/i18n";

export interface StaffMessages {
  readonly title: string;
  readonly count: Plural;
}

export const staffMessages = defineMessages<StaffMessages>({
  en: { title: "Staff", count: { one: "{count} staff member", other: "{count} staff members" } },
  es: { title: "Personal", count: { one: "{count} empleado", other: "{count} empleados" } },
  de: { title: "Team", count: { one: "{count} Teammitglied", other: "{count} Teammitglieder" } },
  fr: { title: "Personnel", count: { one: "{count} employé", other: "{count} employés" } },
});

/** Texts for the module's own error codes, in the shape `errorText` takes; other codes fall back to their class. */
export const staffErrors = defineMessages<ErrorMessages>({
  en: { "staff.not_found": "This team member no longer exists." },
  es: { "staff.not_found": "Este miembro del equipo ya no existe." },
  de: { "staff.not_found": "Dieses Teammitglied existiert nicht mehr." },
  fr: { "staff.not_found": "Ce membre de l’équipe n’existe plus." },
});
