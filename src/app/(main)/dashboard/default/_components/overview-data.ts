import { deals, MONTHLY_REVENUE_TARGET, monthlyWon } from "@/data/crm";
import { monthTotal, openDeals, openStages, sumValue, weightedValue } from "@/lib/crm";

/** Raw figures only: amounts are in the business currency and months are ISO ("2026-05"). Formatting happens in the page. */
export type RevenuePoint = { month: string; revenue: number };

export const revenueSeries: RevenuePoint[] = monthlyWon.map((month) => ({
  month: month.month,
  revenue: monthTotal(month),
}));

export const revenueTarget = MONTHLY_REVENUE_TARGET;

const [previousMonth, currentMonth] = revenueSeries.slice(-2).map((point) => point.revenue);

const wonCount = deals.filter((deal) => deal.stage === "won").length;
const lostCount = deals.filter((deal) => deal.stage === "lost").length;

export const overviewFigures = {
  wonThisMonth: currentMonth ?? 0,
  /** Fraction versus the previous month: 0.12 is +12%. */
  monthChange: previousMonth && currentMonth ? (currentMonth - previousMonth) / previousMonth : 0,
  openPipeline: sumValue(openDeals),
  /** Fraction of closed deals that were won. */
  winRate: wonCount / (wonCount + lostCount),
};

/** The six open deals with the highest weighted value, still with their English demo titles. */
export const hotDeals = [...openDeals].sort((a, b) => weightedValue(b) - weightedValue(a)).slice(0, 6);

const quotaTarget = MONTHLY_REVENUE_TARGET * revenueSeries.length;
const quotaWon = revenueSeries.reduce((total, point) => total + point.revenue, 0);

/** Twelve-month won revenue against twelve monthly targets. */
export const teamQuota = { won: quotaWon, target: quotaTarget, attainment: quotaWon / quotaTarget };

export const stageMix = openStages.map((stage) => {
  const stageDeals = openDeals.filter((deal) => deal.stage === stage);
  return { stage, count: stageDeals.length, value: sumValue(stageDeals) };
});
