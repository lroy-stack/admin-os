import type { LocaleSingularArg } from "@fullcalendar/react";
import deFullCalendar from "@fullcalendar/react/locales/de";
import esFullCalendar from "@fullcalendar/react/locales/es";
import frFullCalendar from "@fullcalendar/react/locales/fr";

import type { Locale } from "@/core/i18n/client";

// English is FullCalendar's built-in locale and has no pack to import. The packs live here, next to the only screen
// that mounts FullCalendar, so no other dashboard bundles them (ADR 0007).
const FULL_CALENDAR_LOCALES: Readonly<Record<Locale, LocaleSingularArg>> = {
  en: "en",
  es: esFullCalendar,
  de: deFullCalendar,
  fr: frFullCalendar,
};

/** The `locale` option of FullCalendar: its chrome (day names, "more", "all day", hints) and its week start. */
export function fullCalendarLocale(locale: Locale): LocaleSingularArg {
  return FULL_CALENDAR_LOCALES[locale];
}
