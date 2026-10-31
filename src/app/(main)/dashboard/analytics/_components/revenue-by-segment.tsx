"use client";

import { useState } from "react";

import { ArrowUpRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { currencySymbol, format, useChartFormatters, useCurrency, useLocale, useMessages } from "@/core/i18n/client";
import { CardIconButton, CurrencyTooltipContent, SegmentedControl, type SegmentedOption } from "@/ds/components";

import type { GrowthReport } from "./growth-data";
import { growthMessageKey } from "./messages";

type Unit = "currency" | "percent";

const segmentKeys = ["enterprise", "midMarket", "smb"] as const;

function MonthTick({
  x,
  y,
  payload,
  lastMonth,
  formatMonth,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
  lastMonth: string;
  formatMonth: (month: string) => string;
}) {
  const current = payload?.value === lastMonth;
  return (
    <text
      x={x}
      y={(y ?? 0) + 12}
      textAnchor="middle"
      className={current ? "fill-foreground text-[11px] font-medium" : "fill-muted-foreground text-[11px]"}
    >
      {payload ? formatMonth(payload.value) : ""}
    </text>
  );
}

export function RevenueBySegment({ report }: { report: GrowthReport }) {
  const text = useMessages(growthMessageKey);
  const locale = useLocale();
  const currency = useCurrency();
  const fmt = useChartFormatters();
  const [unit, setUnit] = useState<Unit>("currency");

  const unitOptions: SegmentedOption<Unit>[] = [
    { value: "currency", label: currencySymbol(currency, locale) },
    { value: "percent", label: "%" },
  ];
  const chartConfig = {
    enterprise: { label: text.segments.enterprise, color: "var(--chart-1)" },
    midMarket: { label: text.segments.midMarket, color: "var(--chart-2)" },
    smb: { label: text.segments.smb, color: "var(--chart-3)" },
  } satisfies ChartConfig;

  const total = report.segmentTotals.enterprise + report.segmentTotals.midMarket + report.segmentTotals.smb;
  const data =
    unit === "currency"
      ? report.segments
      : report.segments.map((point) => {
          const monthTotal = point.enterprise + point.midMarket + point.smb;
          return {
            month: point.month,
            enterprise: Math.round((point.enterprise / monthTotal) * 100) / 100,
            midMarket: Math.round((point.midMarket / monthTotal) * 100) / 100,
            smb: Math.round((point.smb / monthTotal) * 100) / 100,
          };
        });
  const lastMonth = report.segments.at(-1)?.month ?? "";

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-normal">{text.revenueBySegment.title}</CardTitle>
        <CardAction className="flex items-center gap-1.5">
          <SegmentedControl
            label={text.revenueBySegment.unitLabel}
            value={unit}
            options={unitOptions}
            onValueChange={setUnit}
          />
          <CardIconButton icon={ArrowUpRight} label={text.openPipeline} href="/dashboard/crm" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-3xl font-medium tracking-tight tabular-nums">{fmt.currency(total)}</span>
          <span className="text-muted-foreground text-xs">
            {format(text.revenueBySegment.wonSummary, locale, { count: report.months })}
          </span>
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
                {fmt.currencyCompact(report.segmentTotals[key])}
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
              tick={<MonthTick lastMonth={lastMonth} formatMonth={fmt.month} />}
            />
            <YAxis
              width={unit === "currency" ? 56 : 48}
              tickLine={false}
              axisLine={false}
              domain={unit === "currency" ? [0, 200_000] : [0, 1]}
              ticks={unit === "currency" ? [0, 100_000, 200_000] : [0, 0.5, 1]}
              tickFormatter={(value: number) => (unit === "currency" ? fmt.currencyCompact(value) : fmt.percent(value))}
            />
            <ChartTooltip
              cursor={false}
              content={
                unit === "currency" ? (
                  <CurrencyTooltipContent labelFormatter={(label) => fmt.month(String(label))} />
                ) : (
                  <ChartTooltipContent
                    className="w-44"
                    labelFormatter={(label) => fmt.month(String(label))}
                    formatter={(value, name) => `${name} ${fmt.percent(Number(value))}`}
                  />
                )
              }
            />
            <Bar
              dataKey="enterprise"
              name={text.segments.enterprise}
              stackId="segments"
              fill="var(--color-enterprise)"
              background={{ fill: "var(--foreground)", fillOpacity: 0.04, radius: 10 }}
              radius={[0, 0, 8, 8]}
            />
            <Bar dataKey="midMarket" name={text.segments.midMarket} stackId="segments" fill="var(--color-midMarket)" />
            <Bar
              dataKey="smb"
              name={text.segments.smb}
              stackId="segments"
              fill="var(--color-smb)"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
