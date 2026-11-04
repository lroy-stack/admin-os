"use client";

import { useState } from "react";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate, useChartFormatters, useLocale, useMessages } from "@/core/i18n/client";

import { financeMessageKey } from "./messages";
import { type SpendingPeriod, spendingSeries } from "./spending-data";

const PERIODS: readonly SpendingPeriod[] = ["weekly", "monthly", "yearly"];

const isPeriod = (value: string): value is SpendingPeriod => PERIODS.some((period) => period === value);

export function TransactionsOverviewCard() {
  const text = useMessages(financeMessageKey).spending;
  const locale = useLocale();
  const fmt = useChartFormatters();
  const [period, setPeriod] = useState<SpendingPeriod>("weekly");
  const series = spendingSeries(period);
  const chartConfig = {
    expense: { color: "var(--chart-4)", label: text.expense },
    income: { color: "var(--chart-2)", label: text.income },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">{text.title}</CardTitle>
        <CardAction>
          <Select value={period} onValueChange={(value) => isPeriod(value) && setPeriod(value)}>
            <SelectTrigger className="w-40" size="sm" aria-label={text.periodLabel}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {PERIODS.map((value) => (
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
        <ChartContainer config={chartConfig} className="h-50 w-full">
          <LineChart accessibilityLayer data={[...series.points]} margin={{ bottom: 0, left: 0, right: 0, top: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="timestamp"
              domain={[...series.domain]}
              scale="time"
              tickFormatter={(value: number) => formatDate(value, locale, "UTC", series.tick)}
              tickLine={false}
              tickMargin={10}
              ticks={[...series.ticks]}
              tick={{ fontSize: 12 }}
              type="number"
            />
            <YAxis hide axisLine={false} tickLine={false} tickMargin={10} tick={{ fontSize: 12 }} />
            <ChartTooltip
              cursor={false}
              content={({ active, payload, label }) => (
                <ChartTooltipContent
                  active={active}
                  hideLabel
                  label={label}
                  payload={payload?.map((item) => ({
                    ...item,
                    value: typeof item.value === "number" ? fmt.currency(item.value) : item.value,
                  }))}
                />
              )}
            />
            <Line
              connectNulls
              dataKey="income"
              dot={false}
              stroke="var(--color-income)"
              strokeDasharray="5 5"
              strokeLinecap="round"
              strokeWidth={1}
              type="linear"
            />
            <Line
              dataKey="expense"
              dot={false}
              stroke="var(--color-expense)"
              strokeLinecap="round"
              strokeWidth={3}
              type="linear"
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
