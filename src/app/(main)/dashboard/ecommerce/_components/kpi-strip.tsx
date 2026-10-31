"use client";

import { ArrowUpRight, DollarSign, PackageCheck, ReceiptText, RotateCcw, ShoppingBag, Users } from "lucide-react";
import { Area, Bar, CartesianGrid, ComposedChart, XAxis, YAxis } from "recharts";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  format,
  formatAmount,
  formatCalendarDate,
  formatNumber,
  formatPercent,
  useChartFormatters,
  useCurrency,
  useLocale,
  useMessages,
} from "@/core/i18n/client";

import { ecommerceMessageKey } from "./messages";

const revenueBucketRanges = ["01-05", "06-10", "11-15", "16-20", "21-25", "26-31"] as const;
const profitMultipliers = [0.24, 0.28, 0.26] as const;

const revenueBucketValues = [
  [4820, 5150, 5060, 5520, 5990, 6880],
  [5140, 5360, 5520, 5860, 6120, 6720],
  [4920, 4680, 5150, 5360, 5720, 6150],
  [5480, 5920, 5660, 6180, 6340, 6660],
  [5840, 6220, 6480, 6110, 6680, 7230],
  [6280, 6740, 6960, 7120, 6780, 7240],
  [6820, 7240, 7680, 7410, 7920, 7810],
  [6040, 6420, 6150, 6860, 7080, 7090],
  [5860, 6120, 6340, 6080, 6620, 6900],
  [6520, 6840, 7060, 7420, 7160, 8280],
  [6980, 7320, 7640, 7160, 8040, 8620],
  [6900, 7400, 8100, 8600, 8200, 9360],
] as const;

/** Calendar-day bucket of a month, in UTC so the server and the browser agree. */
function getRollingRevenueBuckets() {
  const now = new Date();
  const currentMonth = now.getUTCFullYear() * 12 + now.getUTCMonth();

  return revenueBucketValues.map((values, index) => {
    const month = currentMonth - (revenueBucketValues.length - 1 - index);
    const monthStart = `${Math.floor(month / 12)}-${String((month % 12) + 1).padStart(2, "0")}-01`;
    return { monthStart, values };
  });
}

const revenueOverviewData = getRollingRevenueBuckets().flatMap(({ monthStart, values }) =>
  values.map((revenue, index) => ({
    period: `${monthStart}|${revenueBucketRanges[index]}`,
    profit: Math.round(revenue * profitMultipliers[index % profitMultipliers.length]),
    revenue,
  })),
);

/** Demo figures of the six KPI cards, in the business currency. Changes are fractions (0.158 is +15.8%). */
const figures = {
  totalSales: 48_560,
  totalSalesChange: 0.158,
  totalOrders: 379,
  totalOrdersChange: 0.083,
  customers: 820,
  customersChange: 0.125,
  averageOrder: 128,
  averageOrderChange: -4.2,
  returnRequests: 18,
  returnRequestsChange: 0.006,
  stockAccuracy: 0.97,
  stockAccuracyPoints: 2.4,
};

function splitPeriod(value: string) {
  const [monthStart = "", range = ""] = value.split("|");
  return { monthStart, range };
}

export function KpiStrip() {
  const text = useMessages(ecommerceMessageKey).kpis;
  const locale = useLocale();
  const currency = useCurrency();
  const fmt = useChartFormatters();
  const percent = (ratio: number) => formatPercent(ratio, locale, { signed: true, fractionDigits: 1 });
  const revenueOverviewConfig = {
    revenue: { label: text.revenue, color: "var(--foreground)" },
    profit: { label: text.profit, color: "var(--muted-foreground)" },
  } satisfies ChartConfig;

  function formatMonthTick(value: string) {
    const { monthStart, range } = splitPeriod(value);
    return range === "11-15" ? formatCalendarDate(monthStart, locale, { month: "short", year: "2-digit" }) : "";
  }

  function formatTooltipLabel(value: string) {
    const { monthStart, range } = splitPeriod(value);
    const [first = "1", last = "1"] = range.split("-");
    const [year = 1970, month = 1] = monthStart.split("-").map(Number);
    const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const day = (n: number) => `${monthStart.slice(0, 8)}${String(n).padStart(2, "0")}`;
    return format(text.dateRange, locale, {
      start: formatCalendarDate(day(Number(first)), locale, { month: "short", day: "numeric" }),
      end: formatCalendarDate(day(Math.min(Number(last), lastDayOfMonth)), locale, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    });
  }

  return (
    <div className="bg-card ring-foreground/10 h-full overflow-hidden rounded-xl ring-1 xl:col-span-12">
      <div>
        <div className="grid grid-cols-1 xl:grid-cols-12">
          <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-3 xl:col-span-5 xl:border-r">
            <Card className="border-border h-full rounded-none border-0 border-b ring-0 md:border-r">
              <CardHeader>
                <CardTitle className="text-sm font-normal">{text.totalSales}</CardTitle>
                <CardDescription className="text-foreground text-3xl leading-none tracking-tight tabular-nums">
                  {formatAmount(figures.totalSales, currency, locale, { fractionDigits: 2 })}
                </CardDescription>
                <CardAction className="bg-muted grid size-6 place-items-center rounded-sm">
                  <DollarSign className="text-foreground size-3" />
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-x-1 text-sm">
                  <span className="text-green-700 dark:text-green-300">{percent(figures.totalSalesChange)}</span>
                  <span className="text-muted-foreground">{text.vsLastWeek}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border h-full rounded-none border-0 border-b ring-0">
              <CardHeader>
                <CardTitle className="text-sm font-normal">{text.totalOrders}</CardTitle>
                <CardDescription className="text-foreground text-3xl leading-none tracking-tight tabular-nums">
                  {formatNumber(figures.totalOrders, locale)}
                </CardDescription>
                <CardAction className="bg-muted grid size-6 place-items-center rounded-sm">
                  <ShoppingBag className="text-foreground size-3" />
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-x-1 text-sm">
                  <span className="text-green-700 dark:text-green-300">{percent(figures.totalOrdersChange)}</span>
                  <span className="text-muted-foreground">{text.vsLastWeek}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border h-full rounded-none border-0 border-b ring-0 md:border-r">
              <CardHeader>
                <CardTitle className="text-sm font-normal">{text.customerGrowth}</CardTitle>
                <CardDescription className="text-foreground text-3xl leading-none tracking-tight tabular-nums">
                  {formatNumber(figures.customers, locale)}
                </CardDescription>
                <CardAction className="bg-muted grid size-6 place-items-center rounded-sm">
                  <Users className="text-foreground size-3" />
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-x-1 text-sm">
                  <span className="text-green-700 dark:text-green-300">{percent(figures.customersChange)}</span>
                  <span className="text-muted-foreground">{text.vsLastMonth}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border h-full rounded-none border-0 border-b ring-0">
              <CardHeader>
                <CardTitle className="text-sm font-normal">{text.averageOrder}</CardTitle>
                <CardDescription className="text-foreground text-3xl leading-none tracking-tight tabular-nums">
                  {formatAmount(figures.averageOrder, currency, locale, { fractionDigits: 0 })}
                </CardDescription>
                <CardAction className="bg-muted grid size-6 place-items-center rounded-sm">
                  <ReceiptText className="text-foreground size-3" />
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-x-1 text-sm">
                  <span className="text-destructive">
                    {formatAmount(figures.averageOrderChange, currency, locale, { fractionDigits: 2 })}
                  </span>
                  <span className="text-muted-foreground">{text.vsLastWeek}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border h-full rounded-none border-0 border-b ring-0 md:border-r md:border-b-0">
              <CardHeader>
                <CardTitle className="text-sm font-normal">{text.returnRequests}</CardTitle>
                <CardDescription className="text-foreground text-3xl leading-none tracking-tight tabular-nums">
                  {formatNumber(figures.returnRequests, locale)}
                </CardDescription>
                <CardAction className="bg-muted grid size-6 place-items-center rounded-sm">
                  <RotateCcw className="text-foreground size-3" />
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-x-1 text-sm">
                  <span className="text-destructive">{percent(figures.returnRequestsChange)}</span>
                  <span className="text-muted-foreground">{text.vsLastMonth}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="h-full rounded-none border-0 ring-0">
              <CardHeader>
                <CardTitle className="text-sm font-normal">{text.stockAccuracy}</CardTitle>
                <CardDescription className="text-foreground text-3xl leading-none tracking-tight tabular-nums">
                  {formatPercent(figures.stockAccuracy, locale)}
                </CardDescription>
                <CardAction className="bg-muted grid size-6 place-items-center rounded-sm">
                  <PackageCheck className="text-foreground size-3" />
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-x-1 text-sm">
                  <span className="text-green-700 dark:text-green-300">
                    {format(text.points, locale, {
                      value: formatNumber(figures.stockAccuracyPoints, locale, {
                        signDisplay: "exceptZero",
                        minimumFractionDigits: 1,
                      }),
                    })}
                  </span>
                  <span className="text-muted-foreground">{text.vsLastAudit}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="h-full rounded-none border-0 ring-0 xl:col-span-7">
            <CardHeader>
              <CardTitle className="font-normal">{text.salesOverview}</CardTitle>
              <CardAction>
                <ArrowUpRight className="size-4" />
              </CardAction>
            </CardHeader>

            <CardContent>
              <ChartContainer config={revenueOverviewConfig} className="h-74 w-full">
                <ComposedChart
                  accessibilityLayer
                  data={revenueOverviewData}
                  margin={{ bottom: 0, left: 0, right: 0, top: 0 }}
                >
                  <defs>
                    <filter id="sales-line-glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feFlood floodColor="var(--color-revenue)" floodOpacity="0.35" />
                      <feComposite in2="blur" operator="in" />
                      <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid yAxisId="profit" vertical={false} />
                  <XAxis
                    dataKey="period"
                    axisLine={false}
                    height={30}
                    interval={0}
                    minTickGap={0}
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => formatMonthTick(String(value))}
                  />
                  <YAxis yAxisId="revenue" hide domain={[3000, 10_000]} />
                  <YAxis yAxisId="profit" hide domain={[0, 6000]} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        className="w-40"
                        labelFormatter={(value) => formatTooltipLabel(String(value))}
                        formatter={(value, name, item) => (
                          <>
                            <div
                              className="size-2.5 shrink-0 rounded-[2px]"
                              style={{
                                backgroundColor: item.color,
                              }}
                            />
                            <div className="flex flex-1 items-center justify-between leading-none">
                              <span className="text-muted-foreground">{String(name ?? "")}</span>
                              <span className="text-foreground font-mono font-medium tabular-nums">
                                {typeof value === "number" ? fmt.currency(value) : String(value ?? "")}
                              </span>
                            </div>
                          </>
                        )}
                      />
                    }
                    cursor={{
                      stroke: "var(--border)",
                      strokeDasharray: "4 4",
                    }}
                  />
                  <Bar
                    yAxisId="profit"
                    barSize={4}
                    dataKey="profit"
                    fill="var(--color-profit)"
                    name={text.profit}
                    opacity={0.18}
                    radius={[6, 6, 0, 0]}
                  />
                  <Area
                    yAxisId="revenue"
                    dataKey="revenue"
                    fill="none"
                    filter="url(#sales-line-glow)"
                    name={text.revenue}
                    stroke="var(--color-revenue)"
                    strokeWidth={1.8}
                    type="linear"
                    activeDot={{
                      r: 4,
                      fill: "var(--background)",
                      stroke: "var(--color-revenue)",
                      strokeWidth: 2,
                    }}
                    dot={false}
                  />
                </ComposedChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
