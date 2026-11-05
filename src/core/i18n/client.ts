// Client entry of core/i18n (ADR 0007). Client components import this file, never the full barrel: the barrel also
// carries `defaultErrorMessages` (all four locales) and the zod schemas, which must not reach the browser.
// `.dependency-cruiser.cjs` enforces it for every .tsx file.
export { type ChartFormatters, chartFormatters } from "./chart-format";
export {
  type AmountOptions,
  type CurrencyOption,
  currencyOptions,
  currencySymbol,
  formatAmount,
  formatCalendarDate,
  formatCompact,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatList,
  formatLocalDate,
  formatNumber,
  formatPercent,
  formatRelative,
  formatTime,
  languageName,
  monthNames,
  type NameStyle,
  type PercentOptions,
  weekdayNames,
  weekdayNamesFromWeekStart,
  weekStart,
} from "./format";
export { isLocale, LOCALE_COOKIE, LOCALE_NAMES, LOCALES, type Locale } from "./locale";
export { format, type Message, type MessageParams, type Plural } from "./messages";
export { type MessageBundle, type MessageKey, messageKey, type ResolvedMessages, resolveMessages } from "./namespace";
export type { PageMeta } from "./page-meta";
export { LocaleProvider, useChartFormatters, useCurrency, useLocale, useMessages } from "./provider";
