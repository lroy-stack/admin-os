// UI entry of core/i18n: the locale packs of third-party widgets (react-day-picker through date-fns, FullCalendar).
// They are about 30 KB of locale data, so they are not in the client entry that every screen loads; import this
// entry only where such a widget is mounted.
export { dateFnsLocale, fullCalendarLocale } from "./widget-locales";
