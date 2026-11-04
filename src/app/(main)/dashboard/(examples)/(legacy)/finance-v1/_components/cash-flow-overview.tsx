"use client";

import { useState } from "react";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useChartFormatters, useMessages } from "@/core/i18n/client";
import { CurrencyTooltipContent } from "@/ds/components";

import { type CashFlowPeriod, cashFlowPeriods, inCashFlowPeriod, isCashFlowPeriod } from "./cash-flow-periods";
import { financeV1MessageKey } from "./messages";

// Months are calendar months of one year, so the chart formats them with the active locale.
const chartData = [
  { month: "2026-01", income: 5900, expenses: -4200 },
  { month: "2026-02", income: 3800, expenses: -6100 },
  { month: "2026-03", income: 5200, expenses: -5600 },
  { month: "2026-04", income: 7100, expenses: -3200 },
  { month: "2026-05", income: 4500, expenses: -4400 },
  { month: "2026-06", income: 6100, expenses: -3600 },
  { month: "2026-07", income: 3300, expenses: -5200 },
  { month: "2026-08", income: 4300, expenses: -4000 },
  { month: "2026-09", income: 7200, expenses: -5800 },
  { month: "2026-10", income: 5600, expenses: -4600 },
  { month: "2026-11", income: 3600, expenses: -6400 },
  { month: "2026-12", income: 4700, expenses: -3400 },
];

export function CashFlowOverview() {
  const text = useMessages(financeV1MessageKey).cashFlow;
  const fmt = useChartFormatters();
  const [period, setPeriod] = useState<CashFlowPeriod>("thisYear");
  const visible = chartData.filter((item) => inCashFlowPeriod(item.month, period));
  const totalIncome = visible.reduce((acc, item) => acc + item.income, 0);
  const totalExpenses = visible.reduce((acc, item) => acc + Math.abs(item.expenses), 0);
  const chartConfig = {
    income: { label: text.income, color: "var(--chart-1)" },
    expenses: { label: text.expenses, color: "var(--chart-2)" },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{text.title}</CardTitle>
        <CardDescription>{text.description}</CardDescription>
        <CardAction>
          <Select value={period} onValueChange={(value) => isCashFlowPeriod(value) && setPeriod(value)}>
            <SelectTrigger size="sm" className="w-40" aria-label={text.periodPlaceholder}>
              <SelectValue placeholder={text.periodPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {cashFlowPeriods.map((value) => (
                  <SelectItem key={value} value={value}>
                    {text.periods[value]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Separator />
        <div className="flex items-start justify-between gap-2 py-5 md:items-stretch md:gap-0">
          <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
            <div className="bg-chart-1 flex size-10 shrink-0 items-center justify-center rounded-full">
              <ArrowDownLeft className="stroke-background size-6" />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs uppercase">{text.income}</p>
              <p className="font-medium tabular-nums">{fmt.currency(totalIncome)}</p>
            </div>
          </div>
          <Separator orientation="vertical" className="h-auto! self-stretch" />
          <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
            <div className="bg-chart-2 flex size-10 shrink-0 items-center justify-center rounded-full">
              <ArrowUpRight className="stroke-background size-6" />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs uppercase">{text.expenses}</p>
              <p className="font-medium tabular-nums">{fmt.currency(totalExpenses)}</p>
            </div>
          </div>
        </div>
        <Separator />
        <ChartContainer className="max-h-72 w-full" config={chartConfig}>
          <BarChart
            stackOffset="sign"
            margin={{ left: 0, right: 0, top: 25, bottom: 0 }}
            accessibilityLayer
            data={visible}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              minTickGap={4}
              tickFormatter={(month: string) => fmt.month(month)}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              width={48}
              tickFormatter={(value: number) => fmt.compact(value)}
              ticks={[-8000, -4000, 0, 4000, 8000]}
            />
            <ChartTooltip content={<CurrencyTooltipContent hideLabel />} />
            <ReferenceLine y={0} stroke="var(--border)" />
            <Bar
              dataKey="income"
              name={text.income}
              stackId="a"
              fill={chartConfig.income.color}
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="expenses"
              name={text.expenses}
              stackId="a"
              fill={chartConfig.expenses.color}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
