import { formatNumber, type Locale } from "@/core/i18n/client";

/**
 * A ratio as a percentage with exactly one decimal, for the demo's trend figures (0.125 is "12.5%" in English and
 * "12,5 %" in German and French). `signed` shows "+" on gains and "-" on drops.
 */
export function formatOneDecimalPercent(ratio: number, locale: Locale, signed = false): string {
  return formatNumber(ratio, locale, {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: signed ? "exceptZero" : "auto",
  });
}
