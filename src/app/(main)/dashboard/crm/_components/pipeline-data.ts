import { CalendarClock, TrendingUp, Trophy } from "lucide-react";

import { formatAmount, type Locale } from "@/core/i18n";
import type { Currency } from "@/core/money";
import { deals } from "@/data/crm";
import type { HeaderKpi } from "@/ds/components";
import { dealsClosingWithin, isInCurrentMonth, openDeals, sumValue, weightedValue } from "@/lib/crm";

import type { CrmMessages } from "./messages";

const closingSoon = dealsClosingWithin(30);

/** Raw figures in the business currency; the page formats them in the request's locale. */
export const pipelineFigures = {
  openPipeline: sumValue(openDeals),
  weightedForecast: openDeals.reduce((total, deal) => total + weightedValue(deal), 0),
  closingSoonCount: closingSoon.length,
  closingSoonValue: sumValue(closingSoon),
};

/** The page header's KPI chips, written in one locale and the business currency. */
export function pipelineKpis(
  figures: typeof pipelineFigures,
  text: CrmMessages["kpis"],
  locale: Locale,
  currency: Currency,
): HeaderKpi[] {
  const whole = { fractionDigits: 0 };
  return [
    {
      icon: Trophy,
      value: formatAmount(figures.openPipeline, currency, locale, whole),
      label: text.openPipeline,
    },
    {
      icon: TrendingUp,
      value: formatAmount(figures.weightedForecast, currency, locale, whole),
      label: text.weightedForecast,
    },
    {
      icon: CalendarClock,
      value: String(figures.closingSoonCount),
      label: text.closingSoon,
      badge: { text: formatAmount(figures.closingSoonValue, currency, locale, { compact: true }), tone: "azure" },
    },
  ];
}

const wonThisMonth = deals.filter((deal) => deal.stage === "won" && isInCurrentMonth(deal.closeDate));
const lostThisMonth = deals.filter((deal) => deal.stage === "lost" && isInCurrentMonth(deal.closeDate));

export const outcomes = {
  won: { count: wonThisMonth.length, value: sumValue(wonThisMonth) },
  lost: { count: lostThisMonth.length, value: sumValue(lostThisMonth) },
};
