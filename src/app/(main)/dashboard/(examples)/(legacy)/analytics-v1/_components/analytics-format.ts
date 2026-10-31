import { format, formatNumber, type Locale } from "@/core/i18n/client";
import type { Currency } from "@/core/money/client";

/** 0.724 becomes "72.4%" in English and "72,4 %" in German and French. `Intl` writes the sign and the space. */
export function formatRate(ratio: number, locale: Locale, options: { digits?: number; signed?: boolean } = {}): string {
  const { digits = 1, signed = false } = options;
  return formatNumber(ratio, locale, {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    signDisplay: signed ? "exceptZero" : "auto",
  });
}

/** A whole-unit amount with its sign shown ("+$107,000"), in the business currency. */
export function formatSignedAmount(amount: number, currency: Currency, locale: Locale): string {
  return formatNumber(amount, locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    signDisplay: "exceptZero",
  });
}

/** A duration in days ("35d", "35 days", "+2.3 days"), from `Intl`'s unit style. */
export function formatDays(
  days: number,
  locale: Locale,
  options: { display?: "narrow" | "long"; signed?: boolean; digits?: number } = {},
): string {
  const { display = "narrow", signed = false, digits = 0 } = options;
  return formatNumber(days, locale, {
    style: "unit",
    unit: "day",
    unitDisplay: display,
    maximumFractionDigits: digits,
    signDisplay: signed ? "exceptZero" : "auto",
  });
}

/** Percentage points through the dictionary's template ("+8.3 pp"), because `Intl` has no such unit. */
export function formatPoints(template: string, points: number, locale: Locale, digits = 1): string {
  const value = formatNumber(points, locale, { maximumFractionDigits: digits, signDisplay: "exceptZero" });
  return format(template, locale, { value });
}

/** A coverage multiple such as "1.9" with one decimal. */
export function formatMultiple(value: number, locale: Locale): string {
  return formatNumber(value, locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
