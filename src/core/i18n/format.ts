import type { Locale } from "./locale";

// Intl constructors are expensive; one instance per (kind, locale, options) is enough.
const cache = new Map<string, unknown>();

function memo<T>(kind: string, locale: Locale, options: object | undefined, create: () => T): T {
  const key = `${kind}|${locale}|${JSON.stringify(options ?? {})}`;
  let instance = cache.get(key) as T | undefined;
  if (instance === undefined) {
    instance = create();
    cache.set(key, instance);
  }
  return instance;
}

export function formatNumber(value: number, locale: Locale, options?: Intl.NumberFormatOptions): string {
  return memo("number", locale, options, () => new Intl.NumberFormat(locale, options)).format(value);
}

/**
 * The currency comes from the business settings, never from the locale. Money is stored in minor units; the
 * currency's own digit count (JPY 0, EUR 2, KWD 3) comes from `Intl`, so nothing is hand-tabulated.
 */
export function formatCurrency(amountMinor: number, currency: string, locale: Locale): string {
  const formatter = memo(
    "currency",
    locale,
    { currency },
    () => new Intl.NumberFormat(locale, { style: "currency", currency }),
  );
  const digits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter.format(amountMinor / 10 ** digits);
}

type DateInput = Date | number;

function dateFormatter(locale: Locale, timeZone: string, options: Intl.DateTimeFormatOptions) {
  return memo(
    "date",
    locale,
    { ...options, timeZone },
    () => new Intl.DateTimeFormat(locale, { ...options, timeZone }),
  );
}

// The time zone is the business's (clock capability), never the device's, so it is a required parameter.
export function formatDate(value: DateInput, locale: Locale, timeZone: string, options?: Intl.DateTimeFormatOptions) {
  return dateFormatter(locale, timeZone, options ?? { dateStyle: "medium" }).format(value);
}

export function formatTime(value: DateInput, locale: Locale, timeZone: string, options?: Intl.DateTimeFormatOptions) {
  return dateFormatter(locale, timeZone, options ?? { timeStyle: "short" }).format(value);
}

export function formatDateTime(
  value: DateInput,
  locale: Locale,
  timeZone: string,
  options?: Intl.DateTimeFormatOptions,
) {
  return dateFormatter(locale, timeZone, options ?? { dateStyle: "medium", timeStyle: "short" }).format(value);
}

const RELATIVE_UNITS: readonly (readonly [Intl.RelativeTimeFormatUnit, number])[] = [
  ["year", 365 * 86_400],
  ["month", 30 * 86_400],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
  ["second", 1],
];

/** Elapsed-time wording ("3 hours ago", "yesterday"); `now` is a parameter so the result is deterministic. */
export function formatRelative(value: DateInput, now: DateInput, locale: Locale): string {
  const seconds = (Number(value) - Number(now)) / 1000;
  const [unit, size] = RELATIVE_UNITS.find(([, size]) => Math.abs(seconds) >= size) ?? ["second", 1];
  const formatter = memo("relative", locale, undefined, () => new Intl.RelativeTimeFormat(locale, { numeric: "auto" }));
  return formatter.format(Math.trunc(seconds / size), unit);
}

export function formatList(items: readonly string[], locale: Locale): string {
  return memo("list", locale, undefined, () => new Intl.ListFormat(locale, { type: "conjunction" })).format(items);
}
