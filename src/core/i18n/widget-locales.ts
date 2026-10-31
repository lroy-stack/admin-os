import type { LocaleSingularArg } from "@fullcalendar/react";
import deFullCalendar from "@fullcalendar/react/locales/de";
import esFullCalendar from "@fullcalendar/react/locales/es";
import frFullCalendar from "@fullcalendar/react/locales/fr";
import type { Locale as DateFnsLocale } from "date-fns";
import { de as deDateFns } from "date-fns/locale/de";
import { enUS as enDateFns } from "date-fns/locale/en-US";
import { es as esDateFns } from "date-fns/locale/es";
import { fr as frDateFns } from "date-fns/locale/fr";

import type { Locale } from "./locale";

/**
 * The locale packs of third-party widgets, one per app locale (AC2). Each pack is about 1 KB, so all four are
 * imported statically instead of behind a dynamic import and a loading state.
 */
const DATE_FNS_LOCALES: Readonly<Record<Locale, DateFnsLocale>> = {
  en: enDateFns,
  es: esDateFns,
  de: deDateFns,
  fr: frDateFns,
};

/** For `react-day-picker` (the shadcn `Calendar`) and for date-fns `format`/`formatDistance` options. */
export function dateFnsLocale(locale: Locale): DateFnsLocale {
  return DATE_FNS_LOCALES[locale];
}

// English is FullCalendar's built-in locale and has no pack to import.
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
