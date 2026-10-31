import { CalendarClock, TrendingUp, Trophy } from "lucide-react";

import { deals } from "@/data/crm";
import type { HeaderKpi } from "@/ds/components";
import { dealsClosingWithin, isInCurrentMonth, openDeals, sumValue, weightedValue } from "@/lib/crm";
import { formatCurrency } from "@/lib/utils";

const closingSoon = dealsClosingWithin(30);

export const pipelineKpis: HeaderKpi[] = [
  {
    icon: Trophy,
    value: formatCurrency(sumValue(openDeals), { noDecimals: true }),
    label: "Open pipeline",
  },
  {
    icon: TrendingUp,
    value: formatCurrency(
      openDeals.reduce((total, deal) => total + weightedValue(deal), 0),
      { noDecimals: true },
    ),
    label: "Weighted forecast",
  },
  {
    icon: CalendarClock,
    value: String(closingSoon.length),
    label: "Deals closing in 30 days",
    badge: { text: formatCurrency(sumValue(closingSoon), { compact: true }), tone: "azure" },
  },
];

const wonThisMonth = deals.filter((deal) => deal.stage === "won" && isInCurrentMonth(deal.closeDate));
const lostThisMonth = deals.filter((deal) => deal.stage === "lost" && isInCurrentMonth(deal.closeDate));

export const outcomes = {
  won: { count: wonThisMonth.length, value: sumValue(wonThisMonth) },
  lost: { count: lostThisMonth.length, value: sumValue(lostThisMonth) },
};
