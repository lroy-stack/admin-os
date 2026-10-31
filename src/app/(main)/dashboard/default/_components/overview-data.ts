import { ChartColumn, ChartPie, Trophy } from "lucide-react";

import { deals, MONTHLY_REVENUE_TARGET, monthlyWon } from "@/data/crm";
import type { HeaderKpi } from "@/ds/components";
import { formatMonth, monthTotal, openDeals, openStages, sumValue, weightedValue } from "@/lib/crm";
import { formatCurrency } from "@/lib/utils";

export type RevenuePoint = { month: string; revenue: number };

export const revenueSeries: RevenuePoint[] = monthlyWon.map((month) => ({
  month: formatMonth(month.month),
  revenue: monthTotal(month),
}));

export const revenueTarget = MONTHLY_REVENUE_TARGET;

const [previousMonth, currentMonth] = revenueSeries.slice(-2).map((point) => point.revenue);
const monthChange =
  previousMonth && currentMonth ? Math.round(((currentMonth - previousMonth) / previousMonth) * 100) : 0;

const wonCount = deals.filter((deal) => deal.stage === "won").length;
const lostCount = deals.filter((deal) => deal.stage === "lost").length;

export const overviewKpis: HeaderKpi[] = [
  {
    icon: Trophy,
    value: formatCurrency(currentMonth ?? 0, { noDecimals: true }),
    label: "Won this month",
    badge: {
      text: `${monthChange > 0 ? "+" : ""}${monthChange}% vs last month`,
      tone: monthChange < 0 ? "salmon" : "azure",
    },
  },
  {
    icon: ChartColumn,
    value: formatCurrency(sumValue(openDeals), { noDecimals: true }),
    label: "Open pipeline",
  },
  {
    icon: ChartPie,
    value: `${Math.round((wonCount / (wonCount + lostCount)) * 100)}%`,
    label: "Win rate, closed deals",
  },
];

export const hotDeals = [...openDeals].sort((a, b) => weightedValue(b) - weightedValue(a)).slice(0, 6);

const quotaTarget = MONTHLY_REVENUE_TARGET * revenueSeries.length;
const quotaWon = revenueSeries.reduce((total, point) => total + point.revenue, 0);

/** Twelve-month won revenue against twelve monthly targets. */
export const teamQuota = { won: quotaWon, target: quotaTarget, attainment: quotaWon / quotaTarget };

export const stageMix = openStages.map((stage) => {
  const stageDeals = openDeals.filter((deal) => deal.stage === stage);
  return { stage, count: stageDeals.length, value: sumValue(stageDeals) };
});
