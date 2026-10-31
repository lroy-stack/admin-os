import { ChartColumn, ChartPie, Trophy } from "lucide-react";

import { format, formatAmount, formatPercent, type Locale } from "@/core/i18n";
import type { Currency } from "@/core/money";
import type { HeaderKpi } from "@/ds/components";

import type { OverviewMessages } from "./messages";
import type { overviewFigures } from "./overview-data";

/** The page header's KPI chips, written in one locale and the business currency. */
export function overviewKpis(
  figures: typeof overviewFigures,
  text: OverviewMessages["kpis"],
  locale: Locale,
  currency: Currency,
): HeaderKpi[] {
  const whole = { fractionDigits: 0 };
  return [
    {
      icon: Trophy,
      value: formatAmount(figures.wonThisMonth, currency, locale, whole),
      label: text.won,
      badge: {
        text: format(text.versusLastMonth, locale, {
          change: formatPercent(figures.monthChange, locale, { signed: true }),
        }),
        tone: figures.monthChange < 0 ? "salmon" : "azure",
      },
    },
    { icon: ChartColumn, value: formatAmount(figures.openPipeline, currency, locale, whole), label: text.pipeline },
    { icon: ChartPie, value: formatPercent(figures.winRate, locale), label: text.winRate },
  ];
}
