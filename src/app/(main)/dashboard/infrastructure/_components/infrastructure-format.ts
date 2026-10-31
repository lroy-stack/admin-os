import { formatNumber, type Locale } from "@/core/i18n/client";

import type { InfrastructureEnvironment } from "./infrastructure-data";

/** "86ms" in English, "86 ms" in German: the unit's own narrow form in the locale. */
export function formatLatency(milliseconds: number, locale: Locale): string {
  return formatNumber(milliseconds, locale, { style: "unit", unit: "millisecond", unitDisplay: "narrow" });
}

/** Days and hours in the locale's narrow units ("8d 23h", "8 j 23 h"). */
export function formatUptime(uptime: InfrastructureEnvironment["uptime"], locale: Locale): string {
  const days = formatNumber(uptime.days, locale, { style: "unit", unit: "day", unitDisplay: "narrow" });
  const hours = formatNumber(uptime.hours, locale, { style: "unit", unit: "hour", unitDisplay: "narrow" });
  return `${days} ${hours}`;
}
