// Client entry of core/i18n (ADR 0007). Client components import this file, never the full barrel: the barrel also
// carries `defaultErrorMessages` (all four locales) and the zod schemas, which must not reach the browser.
// `.dependency-cruiser.cjs` enforces it for every .tsx file.
export {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatList,
  formatNumber,
  formatRelative,
  formatTime,
} from "./format";
export { isLocale, LOCALE_COOKIE, LOCALE_NAMES, LOCALES, type Locale } from "./locale";
export { format, type Message, type MessageParams, type Plural } from "./messages";
export { type MessageBundle, type MessageKey, messageKey, type ResolvedMessages, resolveMessages } from "./namespace";
export { LocaleProvider, useLocale, useMessages } from "./provider";
