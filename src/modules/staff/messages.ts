import { defineMessages, type Plural } from "@/core/i18n";

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
