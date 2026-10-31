"use client";

import { useState } from "react";

import { ArrowUpRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { CardIconButton, CurrencyTooltipContent, SegmentedControl, type SegmentedOption } from "@/ds/components";
import { formatCurrency } from "@/lib/utils";

import type { GrowthReport } from "./growth-data";

type Unit = "currency" | "percent";

const unitOptions: SegmentedOption<Unit>[] = [
  { value: "currency", label: "$" },
  { value: "percent", label: "%" },
];

const chartConfig = {
  enterprise: { label: "Enterprise", color: "var(--chart-1)" },
  midMarket: { label: "Mid-market", color: "var(--chart-2)" },
  smb: { label: "SMB", color: "var(--chart-3)" },
} satisfies ChartConfig;

const segmentKeys = ["enterprise", "midMarket", "smb"] as const;

function MonthTick({
  x,
  y,
  payload,
  lastLabel,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
  lastLabel: string;
}) {
  const current = payload?.value === lastLabel;
  return (
    <text
      x={x}
      y={(y ?? 0) + 12}
      textAnchor="middle"
      className={current ? "fill-foreground text-[11px] font-medium" : "fill-muted-foreground text-[11px]"}
    >
      {payload?.value}
    </text>
  );
}

export function RevenueBySegment({ report }: { report: GrowthReport }) {
  const [unit, setUnit] = useState<Unit>("currency");
  const total = report.segmentTotals.enterprise + report.segmentTotals.midMarket + report.segmentTotals.smb;
  const data =
    unit === "currency"
      ? report.segments
      : report.segments.map((point) => {
          const monthTotal = point.enterprise + point.midMarket + point.smb;
          return {
            month: point.month,
            enterprise: Math.round((point.enterprise / monthTotal) * 100),
            midMarket: Math.round((point.midMarket / monthTotal) * 100),
            smb: Math.round((point.smb / monthTotal) * 100),
          };
        });
  const lastLabel = report.segments.at(-1)?.month ?? "";

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-normal">Revenue by segment</CardTitle>
        <CardAction className="flex items-center gap-1.5">
          <SegmentedControl label="Chart unit" value={unit} options={unitOptions} onValueChange={setUnit} />
          <CardIconButton icon={ArrowUpRight} label="Open pipeline" href="/dashboard/crm" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-3xl font-medium tracking-tight tabular-nums">
            {formatCurrency(total, { noDecimals: true })}
          </span>
          <span className="text-muted-foreground text-xs">won, last {report.months} months</span>
        </div>
        <ul className="flex flex-wrap gap-1.5">
          {segmentKeys.map((key) => (
            <li
              key={key}
              className="bg-foreground/8 ring-border flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] ring-1"
            >
              <span className="size-1.5 rounded-full" style={{ backgroundColor: chartConfig[key].color }} />
              {chartConfig[key].label}
              <span className="text-muted-foreground tabular-nums">
                {formatCurrency(report.segmentTotals[key], { compact: true })}
              </span>
            </li>
          ))}
        </ul>
        <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
          <BarChart data={data} barCategoryGap="14%" margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} strokeOpacity={0.5} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              interval={0}
              tick={<MonthTick lastLabel={lastLabel} />}
            />
            <YAxis
              width={44}
              tickLine={false}
              axisLine={false}
              domain={unit === "currency" ? [0, 200_000] : [0, 100]}
              ticks={unit === "currency" ? [0, 100_000, 200_000] : [0, 50, 100]}
              tickFormatter={(value: number) =>
                unit === "currency" ? formatCurrency(value, { compact: true }) : `${value}%`
              }
            />
            <ChartTooltip
              cursor={false}
              content={
                unit === "currency" ? (
                  <CurrencyTooltipContent />
                ) : (
                  <ChartTooltipContent className="w-40" formatter={(value, name) => `${name} ${value}%`} />
                )
              }
            />
            <Bar
              dataKey="enterprise"
              name="Enterprise"
              stackId="segments"
              fill="var(--color-enterprise)"
              background={{ fill: "var(--foreground)", fillOpacity: 0.04, radius: 10 }}
              radius={[0, 0, 8, 8]}
            />
            <Bar dataKey="midMarket" name="Mid-market" stackId="segments" fill="var(--color-midMarket)" />
            <Bar dataKey="smb" name="SMB" stackId="segments" fill="var(--color-smb)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
