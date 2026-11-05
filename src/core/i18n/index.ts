// Server entry of core/i18n (ADR 0007): no React here, so server kernels and Workers load it without a renderer.
// The provider and its hooks are in `@/core/i18n/client`.
export { type ChartFormatters, chartFormatters } from "./chart-format";
export { defaultErrorMessages, type ErrorMessages, errorText } from "./error-text";
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
export { isLocale, LOCALE_COOKIE, LOCALE_NAMES, LOCALES, type Locale, OG_LOCALES } from "./locale";
export { type LocalizedText, localizedTextSchema } from "./localized-text";
export {
  defineMessages,
  format,
  type Message,
  type MessageParams,
  type Plural,
  placeholdersOf,
  type TermFamily,
  type Terms,
  type Vocabulary,
} from "./messages";
export { type MessageBundle, type MessageKey, messageKey, type ResolvedMessages, resolveMessages } from "./namespace";
export type { PageMeta } from "./page-meta";
export { assertDictionaryParity, flattenMessages, placeholderSignature } from "./parity";
export { resolveCurrency } from "./resolve-currency";
export { resolveLocale } from "./resolve-locale";
