export const cashFlowPeriods = ["thisMonth", "lastSixMonths", "yearToDate", "thisYear"] as const;
export type CashFlowPeriod = (typeof cashFlowPeriods)[number];

export const isCashFlowPeriod = (value: string): value is CashFlowPeriod =>
  cashFlowPeriods.some((period) => period === value);

/** The demo's current month, as an ISO year-month: the data runs to the end of the year, "today" is October. */
export const CURRENT_MONTH = "2026-10";

/** Months are ISO year-months, so they sort as text. */
export function inCashFlowPeriod(month: string, period: CashFlowPeriod): boolean {
  switch (period) {
    case "thisMonth":
      return month === CURRENT_MONTH;
    case "lastSixMonths":
      return month > "2026-04" && month <= CURRENT_MONTH;
    case "yearToDate":
      return month >= "2026-01" && month <= CURRENT_MONTH;
    case "thisYear":
      return month >= "2026-01" && month <= "2026-12";
  }
}
