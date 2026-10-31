import { formatNumber, type Locale } from "@/core/i18n/client";

/** 0.546 becomes "+54.6%" in English and "+54,6 %" in German and French; `Intl` writes the sign and the space. */
export function formatRate(ratio: number, locale: Locale, options: { digits?: number; signed?: boolean } = {}): string {
  const { digits = 1, signed = false } = options;
  return formatNumber(ratio, locale, {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    signDisplay: signed ? "exceptZero" : "auto",
  });
}
