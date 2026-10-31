import { formatAmount, formatCompact, formatDate, formatPercent } from "./format";
import type { Locale } from "./locale";

/** Formatters for recharts `tickFormatter` and tooltip `formatter` props, bound to one locale (and currency). */
export interface ChartFormatters {
  /** "$258.6K": legends and labels where space is short. */
  readonly currencyCompact: (value: number) => string;
  /** "$258,600": tooltip rows and totals. */
  readonly currency: (value: number) => string;
  readonly compact: (value: number) => string;
  /** Takes a fraction: 0.64 is "64%". */
  readonly percent: (value: number) => string;
  /** An ISO month ("2026-05") or calendar day ("2026-05-14") as a short month name, or month and day. */
  readonly month: (isoDate: string) => string;
  readonly day: (isoDate: string) => string;
}

/**
 * One call per chart: `const fmt = chartFormatters(locale, "USD")`, then `tickFormatter={fmt.compact}`. Dates in
 * chart data are calendar days, so they are formatted in UTC and never shift.
 */
export function chartFormatters(locale: Locale, currency: string): ChartFormatters {
  const utc = (isoDate: string) => new Date(`${isoDate.length === 7 ? `${isoDate}-01` : isoDate}T00:00:00Z`);
  return {
    currencyCompact: (value) => formatAmount(value, currency, locale, { compact: true }),
    currency: (value) => formatAmount(value, currency, locale, { fractionDigits: 0 }),
    compact: (value) => formatCompact(value, locale),
    percent: (value) => formatPercent(value, locale),
    month: (isoDate) => formatDate(utc(isoDate), locale, "UTC", { month: "short" }),
    day: (isoDate) => formatDate(utc(isoDate), locale, "UTC", { month: "short", day: "numeric" }),
  };
}
