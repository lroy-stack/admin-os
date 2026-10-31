"use client";

import { BadgeDollarSign, Wallet } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, Line, LineChart, XAxis } from "recharts";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  formatAmount,
  formatCalendarDate,
  formatNumber,
  formatPercent,
  format as formatText,
  useChartFormatters,
  useCurrency,
  useLocale,
  useMessages,
} from "@/core/i18n/client";
import { CurrencyTooltipContent } from "@/ds/components";

import { LAST_MONTH, leadsChartData, overviewFigures, proposalsChartData, revenueChartData } from "./crm.config";
import { crmV1MessageKey } from "./messages";

const SIX_MONTHS = 6;

export function OverviewCards() {
  const text = useMessages(crmV1MessageKey).overview;
  const locale = useLocale();
  const currency = useCurrency();
  const fmt = useChartFormatters();

  const leadsChartConfig = {
    newLeads: { label: text.newLeadsSeries, color: "var(--chart-1)" },
    disqualified: { label: text.disqualifiedSeries, color: "var(--chart-3)" },
    background: { color: "var(--primary)" },
  } satisfies ChartConfig;
  const proposalsChartConfig = {
    proposalsSent: { label: text.proposals, color: "var(--chart-1)" },
  } satisfies ChartConfig;
  const revenueChartConfig = {
    revenue: { label: text.revenue, color: "var(--chart-1)" },
  } satisfies ChartConfig;

  const lastMonth = formatCalendarDate(`${LAST_MONTH}-01`, locale, { month: "long" });
  const rangeLabel = (label: unknown) =>
    formatText(text.tooltipRange, locale, { month: lastMonth, range: String(label) });
  const totalNewLeads = leadsChartData.reduce((sum, bucket) => sum + bucket.newLeads, 0);
  const lastMonths = formatText(text.lastMonths, locale, { months: SIX_MONTHS });

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <Card>
        <CardHeader>
          <CardTitle>{text.newLeads}</CardTitle>
          <CardDescription>{text.lastMonth}</CardDescription>
        </CardHeader>
        <CardContent className="size-full">
          <ChartContainer className="size-full min-h-24" config={leadsChartConfig}>
            <BarChart accessibilityLayer data={leadsChartData} barSize={8}>
              <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} hide />
              <ChartTooltip content={<ChartTooltipContent labelFormatter={rangeLabel} />} />
              <Bar
                background={{ fill: "var(--color-background)", radius: 4, opacity: 0.07 }}
                dataKey="newLeads"
                stackId="a"
                fill="var(--color-newLeads)"
                radius={[0, 0, 0, 0]}
              />
              <Bar dataKey="disqualified" stackId="a" fill="var(--color-disqualified)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex items-center justify-between gap-2">
          <span className="text-xl font-semibold tabular-nums">{formatNumber(totalNewLeads, locale)}</span>
          <span className="text-sm font-medium text-green-500 tabular-nums">
            {formatPercent(overviewFigures.newLeadsChange, locale, {
              signed: true,
              minFractionDigits: 1,
              maxFractionDigits: 1,
            })}
          </span>
        </CardFooter>
      </Card>

      <Card className="overflow-hidden pb-0">
        <CardHeader>
          <CardTitle>{text.proposals}</CardTitle>
          <CardDescription>{text.lastMonth}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ChartContainer className="size-full min-h-24" config={proposalsChartConfig}>
            <AreaChart
              data={proposalsChartData}
              margin={{
                left: 0,
                right: 0,
                top: 5,
              }}
            >
              <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} hide />
              <ChartTooltip content={<ChartTooltipContent labelFormatter={rangeLabel} hideIndicator />} />
              <Area
                dataKey="proposalsSent"
                fill="var(--color-proposalsSent)"
                fillOpacity={0.05}
                stroke="var(--color-proposalsSent)"
                strokeWidth={2}
                type="monotone"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="w-fit rounded-lg bg-green-500/10 p-2">
            <Wallet className="size-5 text-green-500" />
          </div>
        </CardHeader>
        <CardContent className="flex size-full flex-col justify-between gap-2">
          <div className="space-y-1.5">
            <CardTitle className="break-words hyphens-auto">{text.revenue}</CardTitle>
            <CardDescription>{lastMonths}</CardDescription>
          </div>
          <p className="text-2xl font-medium tabular-nums">
            {formatAmount(overviewFigures.revenue, currency, locale, { fractionDigits: 0 })}
          </p>
          <div className="w-fit rounded-md bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500 tabular-nums">
            {formatPercent(overviewFigures.revenueChange, locale, {
              signed: true,
              minFractionDigits: 1,
              maxFractionDigits: 1,
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="bg-destructive/10 w-fit rounded-lg p-2">
            <BadgeDollarSign className="text-destructive size-5" />
          </div>
        </CardHeader>
        <CardContent className="flex size-full flex-col justify-between gap-2">
          <div className="space-y-1.5">
            <CardTitle className="break-words hyphens-auto">{text.projectsWon}</CardTitle>
            <CardDescription>{lastMonths}</CardDescription>
          </div>
          <p className="text-2xl font-medium tabular-nums">{formatNumber(overviewFigures.projectsWon, locale)}</p>
          <div className="bg-destructive/10 text-destructive w-fit rounded-md px-2 py-1 text-xs font-medium tabular-nums">
            {formatPercent(overviewFigures.projectsWonChange, locale, {
              signed: true,
              minFractionDigits: 1,
              maxFractionDigits: 1,
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-1 xl:col-span-2">
        <CardHeader>
          <CardTitle>{text.revenueGrowth}</CardTitle>
          <CardDescription>{text.yearToDate}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={revenueChartConfig} className="h-24 w-full">
            <LineChart
              data={revenueChartData}
              margin={{
                top: 5,
                right: 10,
                left: 10,
                bottom: 0,
              }}
            >
              <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} hide />
              <ChartTooltip
                content={
                  <CurrencyTooltipContent
                    labelFormatter={(month) =>
                      formatCalendarDate(`${String(month)}-01`, locale, { month: "short", year: "numeric" })
                    }
                  />
                }
              />
              <Line
                type="monotone"
                strokeWidth={2}
                dataKey="revenue"
                name={text.revenue}
                stroke="var(--color-revenue)"
                activeDot={{
                  r: 6,
                }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
        <CardFooter>
          <p className="text-muted-foreground text-sm">
            {formatText(text.sinceLastYear, locale, { growth: fmt.percent(overviewFigures.yearGrowth) })}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
