import { format, formatDate, formatNumber, type Locale } from "@/core/i18n/client";

type SupportedUnit = "celsius" | "percent";

/** The unit's own symbol in the locale ("°C", "%"), taken from `Intl` so it is never typed by hand. */
export function unitSymbol(unit: SupportedUnit, locale: Locale): string {
  const options: Intl.NumberFormatOptions =
    unit === "percent" ? { style: "percent" } : { style: "unit", unit: "celsius", unitDisplay: "narrow" };
  const symbolType = unit === "percent" ? "percentSign" : "unit";
  const part = new Intl.NumberFormat(locale, options).formatToParts(0).find(({ type }) => type === symbolType);
  return part?.value ?? "";
}

/** 36.8 becomes "36.8" in English and "36,8" in German and French. */
export function formatTemperature(value: number, locale: Locale): string {
  return formatNumber(value, locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/** An alarm limit range such as "50–100"; `digits` pins the decimals of the bounds (36.0–38.0). */
export function formatLimits(template: string, locale: Locale, min: number, max: number, digits = 0): string {
  const bound = (value: number) =>
    formatNumber(value, locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return format(template, locale, { min: bound(min), max: bound(max) });
}

/** A whole hour of the day as the monitor's 24-hour axis label ("21:00"). */
export function formatHourMark(hour: number, locale: Locale): string {
  return formatDate(Date.UTC(1970, 0, 1, hour), locale, "UTC", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}
