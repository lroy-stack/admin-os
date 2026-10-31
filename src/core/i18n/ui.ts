// UI entry of core/i18n: the date-fns locale packs for react-day-picker (the shadcn `Calendar`) and date-fns options.
// The four packs are small, but they are not in the client entry that every screen loads; import this entry only where
// such a widget is mounted. FullCalendar's packs are not here: they live next to the calendar route, its only consumer.
import type { Locale as DateFnsLocale } from "date-fns";
import { de as deDateFns } from "date-fns/locale/de";
import { enUS as enDateFns } from "date-fns/locale/en-US";
import { es as esDateFns } from "date-fns/locale/es";
import { fr as frDateFns } from "date-fns/locale/fr";

import type { Locale } from "./locale";

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
