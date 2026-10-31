"use client";

import { useState } from "react";

import { ArrowUpRight, Ellipsis } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { format, useChartFormatters, useLocale, useMessages } from "@/core/i18n/client";
import { CardIconButton, CurrencyTooltipContent, SegmentedControl, type SegmentedOption } from "@/ds/components";

import { overviewMessageKey } from "./messages";
import type { RevenuePoint } from "./overview-data";

type Range = "6M" | "12M";

export function RevenueCard({ series, target }: { series: RevenuePoint[]; target: number }) {
  const text = useMessages(overviewMessageKey).revenue;
  const locale = useLocale();
  const fmt = useChartFormatters();
  const [range, setRange] = useState<Range>("12M");
  const visible = range === "6M" ? series.slice(-6) : series;
  const total = visible.reduce((sum, point) => sum + point.revenue, 0);
  const monthsAtTarget = visible.filter((point) => point.revenue >= target).length;

  const rangeOptions: SegmentedOption<Range>[] = [
    { value: "6M", label: text.ranges.sixMonths },
    { value: "12M", label: text.ranges.twelveMonths },
  ];
  const chartConfig = { revenue: { label: text.won, color: "var(--chart-1)" } } satisfies ChartConfig;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-normal">{text.title}</CardTitle>
        <CardAction className="flex items-center gap-1.5">
          <SegmentedControl label={text.rangeLabel} value={range} options={rangeOptions} onValueChange={setRange} />
          <CardIconButton icon={Ellipsis} label={text.options} />
          <CardIconButton icon={ArrowUpRight} label={text.openReports} href="/dashboard/analytics" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-3xl font-medium tracking-tight tabular-nums">{fmt.currency(total)}</span>
          <span className="text-muted-foreground text-xs">
            {format(text.summary, locale, { count: visible.length, atTarget: monthsAtTarget })}
          </span>
        </div>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="bg-chart-1 size-1.5 rounded-full" />
            {text.won}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="border-foreground/60 w-3 border-t border-dashed" />
            {format(text.target, locale, { amount: fmt.currencyCompact(target) })}
          </span>
        </div>
        <ChartContainer config={chartConfig} className="aspect-auto h-60 w-full">
          <AreaChart data={visible} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--color-revenue)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeOpacity={0.5} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              minTickGap={8}
              tickFormatter={(month: string) => fmt.month(month)}
            />
            <YAxis
              width={52}
              tickLine={false}
              axisLine={false}
              ticks={[0, 100_000, 200_000]}
              domain={[0, 200_000]}
              tickFormatter={(value: number) => fmt.compact(value)}
            />
            <ChartTooltip
              cursor={{ stroke: "var(--border)" }}
              content={<CurrencyTooltipContent labelFormatter={(label) => fmt.month(String(label))} />}
            />
            <ReferenceLine y={target} stroke="var(--foreground)" strokeOpacity={0.55} strokeDasharray="6 6" />
            <Area
              type="natural"
              dataKey="revenue"
              name={text.won}
              stroke="var(--color-revenue)"
              strokeWidth={2}
              fill="url(#revenue-fill)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
