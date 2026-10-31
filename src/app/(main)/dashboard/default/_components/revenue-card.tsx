"use client";

import { useState } from "react";

import { ArrowUpRight, Ellipsis } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { CardIconButton, CurrencyTooltipContent, SegmentedControl, type SegmentedOption } from "@/ds/components";
import { formatCurrency } from "@/lib/utils";

import type { RevenuePoint } from "./overview-data";

type Range = "6M" | "12M";

const rangeOptions: SegmentedOption<Range>[] = [
  { value: "6M", label: "6M" },
  { value: "12M", label: "12M" },
];

const chartConfig = {
  revenue: { label: "Won revenue", color: "var(--color-salmon)" },
} satisfies ChartConfig;

export function RevenueCard({ series, target }: { series: RevenuePoint[]; target: number }) {
  const [range, setRange] = useState<Range>("12M");
  const visible = range === "6M" ? series.slice(-6) : series;
  const total = visible.reduce((sum, point) => sum + point.revenue, 0);
  const monthsAtTarget = visible.filter((point) => point.revenue >= target).length;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-normal">Revenue</CardTitle>
        <CardAction className="flex items-center gap-1.5">
          <SegmentedControl label="Revenue range" value={range} options={rangeOptions} onValueChange={setRange} />
          <CardIconButton icon={Ellipsis} label="Revenue options" />
          <CardIconButton icon={ArrowUpRight} label="Open growth reports" href="/dashboard/analytics" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-3xl font-medium tracking-tight tabular-nums">
            {formatCurrency(total, { noDecimals: true })}
          </span>
          <span className="text-muted-foreground text-xs">
            won in {visible.length} months · {monthsAtTarget} of {visible.length} at target
          </span>
        </div>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="bg-salmon size-1.5 rounded-full" />
            Won revenue
          </span>
          <span className="flex items-center gap-1.5">
            <span className="border-foreground/60 w-3 border-t border-dashed" />
            Monthly target · {formatCurrency(target, { compact: true })}
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
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} minTickGap={8} />
            <YAxis
              width={44}
              tickLine={false}
              axisLine={false}
              ticks={[0, 100_000, 200_000]}
              domain={[0, 200_000]}
              tickFormatter={(value: number) => formatCurrency(value, { compact: true })}
            />
            <ChartTooltip cursor={{ stroke: "var(--border)" }} content={<CurrencyTooltipContent />} />
            <ReferenceLine y={target} stroke="var(--foreground)" strokeOpacity={0.55} strokeDasharray="6 6" />
            <Area
              type="natural"
              dataKey="revenue"
              name="Won revenue"
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
