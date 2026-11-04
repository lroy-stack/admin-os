export type SpendingPeriod = "weekly" | "monthly" | "yearly";

export interface SpendingPoint {
  readonly timestamp: number;
  readonly expense: number;
  readonly income?: number;
}

export interface SpendingSeries {
  readonly points: readonly SpendingPoint[];
  readonly ticks: readonly number[];
  readonly domain: readonly [number, number];
  /** How an axis tick reads: a weekday, a day of the month or a month. */
  readonly tick: Intl.DateTimeFormatOptions;
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const weekStart = Date.UTC(2026, 0, 5);
const monthStart = Date.UTC(2026, 0, 1);

/** Offsets in hours from the start of the week, with the amount spent and, on a few, the amount received. */
const weekly: readonly [number, number, number?][] = [
  [2.4, 23, 38],
  [8.4, 32],
  [14.88, 26],
  [21.12, 39],
  [27.6, 37],
  [34.08, 52],
  [40.32, 15],
  [46.08, 36],
  [51.84, 31],
  [57.6, 45, 44],
  [63.36, 53],
  [69.12, 40],
  [74.88, 26],
  [80.4, 42],
  [85.92, 47],
  [91.68, 50],
  [97.2, 34],
  [102.72, 53],
  [108.48, 44],
  [114, 70],
  [119.52, 50],
  [124.8, 51],
  [130.08, 34, 54],
  [135.36, 39],
  [140.64, 30],
  [145.92, 50],
  [151.2, 48],
  [156.48, 67],
  [161.76, 33],
  [166.08, 53, 58],
];

const monthlyExpense = [
  120, 85, 140, 60, 95, 210, 180, 75, 110, 130, 90, 160, 70, 100, 240, 115, 85, 125, 150, 65, 105, 190, 135, 80, 95,
  145, 120, 170, 90, 110,
];
const monthlyIncome: Readonly<Record<number, number>> = { 0: 900, 14: 1200, 29: 400 };

const yearlyExpense = [2100, 1850, 2300, 1990, 2150, 2400, 2250, 2050, 2380, 2200, 2600, 2900];
const yearlyIncome = [3200, 3200, 3400, 3200, 3300, 3600, 3300, 3200, 3500, 3400, 3700, 4200];

const SERIES: Record<SpendingPeriod, SpendingSeries> = {
  weekly: {
    points: weekly.map(([hours, expense, income]) => ({ timestamp: weekStart + hours * HOUR_MS, expense, income })),
    ticks: Array.from({ length: 7 }, (_, day) => weekStart + (day + 0.5) * DAY_MS),
    domain: [weekStart, weekStart + 7 * DAY_MS],
    tick: { weekday: "short" },
  },
  monthly: {
    points: monthlyExpense.map((expense, day) => ({
      timestamp: monthStart + (day + 0.5) * DAY_MS,
      expense,
      income: monthlyIncome[day],
    })),
    ticks: [0, 5, 10, 15, 20, 25].map((day) => monthStart + (day + 0.5) * DAY_MS),
    domain: [monthStart, monthStart + 30 * DAY_MS],
    tick: { day: "numeric" },
  },
  yearly: {
    points: yearlyExpense.map((expense, month) => ({
      timestamp: Date.UTC(2026, month, 15),
      expense,
      income: yearlyIncome[month],
    })),
    ticks: yearlyExpense.map((_, month) => Date.UTC(2026, month, 15)),
    domain: [Date.UTC(2026, 0, 1), Date.UTC(2027, 0, 1)],
    tick: { month: "short" },
  },
};

export function spendingSeries(period: SpendingPeriod): SpendingSeries {
  return SERIES[period];
}

/** The ledger of the Transactions tab: the week's movements, latest first, one row per expense or income. */
export interface LedgerRow {
  readonly timestamp: number;
  readonly kind: "expense" | "income";
  readonly amount: number;
}

export function weekLedger(): LedgerRow[] {
  const rows = SERIES.weekly.points.flatMap((point): LedgerRow[] => [
    { timestamp: point.timestamp, kind: "expense", amount: point.expense },
    ...(point.income === undefined
      ? []
      : [{ timestamp: point.timestamp, kind: "income" as const, amount: point.income }]),
  ]);
  return rows.sort((a, b) => b.timestamp - a.timestamp);
}
