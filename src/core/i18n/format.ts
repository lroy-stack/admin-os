import { CURRENCIES, type Currency } from "@/core/money/client";

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
    () => new Intl.NumberFormat(locale, { style: "currency", currency, currencyDisplay: "narrowSymbol" }),
  );
  const digits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter.format(amountMinor / 10 ** digits);
}

export interface AmountOptions {
  /** Short form such as "$258.6K" in English and "1,2 Mio. $" in German. */
  readonly compact?: boolean;
  /** Pins the number of decimals, for example 0 for whole-unit amounts; otherwise `Intl` decides. */
  readonly fractionDigits?: number;
}

/**
 * An amount in major units (258600 means 258 600 dollars), for demo data and chart axes. Money in storage is in minor
 * units and goes through `formatCurrency`. As there, the currency is the data's, never the locale's.
 */
export function formatAmount(amount: number, currency: string, locale: Locale, options: AmountOptions = {}): string {
  const { compact = false, fractionDigits } = options;
  // Narrow symbol everywhere, like `currencySymbol`: "£" in every locale instead of "GBP" (es) or "£GB" (fr).
  const formatOptions: Intl.NumberFormatOptions = { style: "currency", currency, currencyDisplay: "narrowSymbol" };
  if (compact) {
    formatOptions.notation = "compact";
    formatOptions.maximumFractionDigits = fractionDigits ?? 1;
    formatOptions.minimumFractionDigits = fractionDigits ?? 0;
  } else if (fractionDigits !== undefined) {
    formatOptions.maximumFractionDigits = fractionDigits;
    formatOptions.minimumFractionDigits = fractionDigits;
  }
  return formatNumber(amount, locale, formatOptions);
}

/** 1 234 567 becomes "1.2M" in English and "1,2 Mio." in German. */
export function formatCompact(value: number, locale: Locale): string {
  return formatNumber(value, locale, { notation: "compact", maximumFractionDigits: 1 });
}

export interface PercentOptions {
  /** The most decimals shown (default 0): 12.5 % needs `maxFractionDigits: 1` or more, else it rounds to 13 %. */
  readonly maxFractionDigits?: number;
  /** The fewest decimals shown (default 0): `minFractionDigits: 1` writes 12 % as "12.0%". */
  readonly minFractionDigits?: number;
  /** Shows "+" on positive values (and "-" on negative ones), for changes versus a previous period. */
  readonly signed?: boolean;
}

/** `ratio` is a fraction: 0.64 is "64%" in English and "64 %" in German and French. */
export function formatPercent(ratio: number, locale: Locale, options: PercentOptions = {}): string {
  const { maxFractionDigits = 0, minFractionDigits = 0, signed = false } = options;
  return formatNumber(ratio, locale, {
    style: "percent",
    minimumFractionDigits: minFractionDigits,
    maximumFractionDigits: Math.max(maxFractionDigits, minFractionDigits),
    signDisplay: signed ? "exceptZero" : "auto",
  });
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

/**
 * A date without a time ("2026-10-31") names a calendar day, not an instant. It is formatted in UTC so it never
 * shifts with a time zone.
 */
export function formatCalendarDate(isoDate: string, locale: Locale, options?: Intl.DateTimeFormatOptions): string {
  return formatDate(new Date(`${isoDate}T00:00:00Z`), locale, "UTC", options);
}

/**
 * For values a browser widget built in the device's zone (date pickers, FullCalendar events at local midnight).
 * Business data uses `formatDate` with the business time zone instead.
 */
export function formatLocalDate(value: DateInput, locale: Locale, options?: Intl.DateTimeFormatOptions): string {
  const resolved = options ?? { dateStyle: "medium" };
  return memo("local-date", locale, resolved, () => new Intl.DateTimeFormat(locale, resolved)).format(value);
}

export type NameStyle = "long" | "short" | "narrow";

/** January to December in the locale ("October", "octubre", "Oktober", "octobre"), in calendar order. */
export function monthNames(locale: Locale, style: NameStyle = "long"): string[] {
  return Array.from({ length: 12 }, (_, month) =>
    formatDate(Date.UTC(2026, month, 15), locale, "UTC", { month: style }),
  );
}

/** Sunday to Saturday, indexed like `Date#getDay()`. Use `weekdayNamesFromWeekStart` for column headers. */
export function weekdayNames(locale: Locale, style: NameStyle = "long"): string[] {
  // 2026-11-01 is a Sunday.
  return Array.from({ length: 7 }, (_, day) =>
    formatDate(Date.UTC(2026, 10, 1 + day), locale, "UTC", { weekday: style }),
  );
}

/** First day of the week as `Date#getDay()` numbers it: 0 is Sunday, 1 is Monday. Not `Intl`'s 1 to 7. */
const WEEK_START: Readonly<Record<Locale, 0 | 1>> = { en: 0, es: 1, de: 1, fr: 1 };

export function weekStart(locale: Locale): 0 | 1 {
  return WEEK_START[locale];
}

/** The seven weekday names in column order for the locale: Sunday first in English, Monday first elsewhere. */
export function weekdayNamesFromWeekStart(locale: Locale, style: NameStyle = "long"): string[] {
  const names = weekdayNames(locale, style);
  const start = weekStart(locale);
  return [...names.slice(start), ...names.slice(0, start)];
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

/** The narrow symbol of a currency in the locale ("$", "€", "£"), for input adornments. */
export function currencySymbol(currency: Currency, locale: Locale): string {
  const parts = memo(
    "currency-symbol",
    locale,
    { currency },
    () => new Intl.NumberFormat(locale, { style: "currency", currency, currencyDisplay: "narrowSymbol" }),
  ).formatToParts(0);
  return parts.find((part) => part.type === "currency")?.value ?? currency;
}

export interface CurrencyOption {
  readonly value: Currency;
  /** The currency named in the active locale, with its symbol: "euro (€)", "Pfund Sterling (£)". */
  readonly label: string;
}

/** A language named by its code ("es") in the active locale ("Spanish"); the code itself when it is not a language. */
export function languageName(code: string, locale: Locale): string {
  try {
    return (
      memo("language-names", locale, undefined, () => new Intl.DisplayNames(locale, { type: "language" })).of(code) ??
      code
    );
  } catch {
    return code;
  }
}

/** The currency picker's options: exactly `CURRENCIES`, named by `Intl.DisplayNames` in the active locale. */
export function currencyOptions(locale: Locale): CurrencyOption[] {
  const names = memo("currency-names", locale, undefined, () => new Intl.DisplayNames(locale, { type: "currency" }));
  return CURRENCIES.map((currency) => {
    return { value: currency, label: `${names.of(currency) ?? currency} (${currencySymbol(currency, locale)})` };
  });
}
