"use client";

import { ArrowUpRight } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { format, useChartFormatters, useLocale, useMessages } from "@/core/i18n/client";
import { CardIconButton } from "@/ds/components";

import type { GrowthReport } from "./growth-data";
import { growthMessageKey } from "./messages";

export function WinRateTrend({ report }: { report: GrowthReport }) {
  const text = useMessages(growthMessageKey);
  const locale = useLocale();
  const fmt = useChartFormatters();
  const chartConfig = {
    rate: { label: text.winRate.series, color: "var(--color-brand)" },
  } satisfies ChartConfig;
  const average = report.winRate.reduce((total, point) => total + point.rate, 0) / report.winRate.length;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-normal">{text.winRate.title}</CardTitle>
        <CardAction className="flex items-center gap-3">
          <span className="text-muted-foreground flex gap-1 text-[11px]">
            {text.winRate.average}
            <span className="text-foreground tabular-nums">{fmt.percent(average)}</span>
          </span>
          <CardIconButton icon={ArrowUpRight} label={text.openPipeline} href="/dashboard/crm" />
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-44 w-full">
          <AreaChart data={report.winRate} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="win-rate-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-rate)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--color-rate)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeOpacity={0.5} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={0}
              tickFormatter={(month: string) => fmt.month(month)}
            />
            <YAxis
              width={44}
              tickLine={false}
              axisLine={false}
              domain={[0, 1]}
              ticks={[0, 0.5, 1]}
              tickFormatter={(value: number) => fmt.percent(value)}
            />
            <ChartTooltip
              cursor={{ stroke: "var(--border)" }}
              content={
                <ChartTooltipContent
                  indicator="line"
                  labelFormatter={(label) => fmt.month(String(label))}
                  formatter={(value) => format(text.winRate.tooltip, locale, { rate: fmt.percent(Number(value)) })}
                />
              }
            />
            <ReferenceLine y={average} stroke="var(--foreground)" strokeOpacity={0.45} strokeDasharray="6 6" />
            <Area
              type="natural"
              dataKey="rate"
              stroke="var(--color-rate)"
              strokeWidth={2}
              fill="url(#win-rate-fill)"
              dot={{ r: 3, fill: "var(--color-rate)", strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
