"use client";

import { ArrowUpRight } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { CardIconButton } from "@/ds/components";

import type { GrowthReport } from "./growth-data";

const chartConfig = {
  rate: { label: "Win rate", color: "var(--color-brand)" },
} satisfies ChartConfig;

export function WinRateTrend({ report }: { report: GrowthReport }) {
  const average = Math.round(report.winRate.reduce((total, point) => total + point.rate, 0) / report.winRate.length);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-normal">Win rate trend</CardTitle>
        <CardAction className="flex items-center gap-3">
          <span className="text-muted-foreground text-[11px]">
            Average <span className="text-foreground tabular-nums">{average}%</span>
          </span>
          <CardIconButton icon={ArrowUpRight} label="Open pipeline" href="/dashboard/crm" />
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
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} interval={0} />
            <YAxis
              width={36}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              ticks={[0, 50, 100]}
              tickFormatter={(value: number) => `${value}%`}
            />
            <ChartTooltip
              cursor={{ stroke: "var(--border)" }}
              content={<ChartTooltipContent indicator="line" formatter={(value) => `Win rate ${value}%`} />}
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
