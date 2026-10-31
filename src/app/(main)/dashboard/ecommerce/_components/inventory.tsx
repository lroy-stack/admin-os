"use client";

import { ArrowUpRight, PackageCheck, PackageX, TriangleAlert } from "lucide-react";
import { Label, Pie, PieChart } from "recharts";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import { Separator } from "@/components/ui/separator";
import { format, formatNumber, formatPercent, useLocale, useMessages } from "@/core/i18n/client";

import { ecommerceMessageKey } from "./messages";

const chartData = [{ month: "current", "in-stock": 760, "low-stock": 320, "out-of-stock": 160 }];
const totalUnits = chartData[0]["in-stock"] + chartData[0]["low-stock"] + chartData[0]["out-of-stock"];
const availableRatio = chartData[0]["in-stock"] / totalUnits;
const gaugeSegmentCount = 32;
const inStockSegments = Math.round((chartData[0]["in-stock"] / totalUnits) * gaugeSegmentCount);
const lowStockSegments = Math.round((chartData[0]["low-stock"] / totalUnits) * gaugeSegmentCount);

function getGaugeSegmentStatus(index: number) {
  if (index < inStockSegments) {
    return "in-stock";
  }

  if (index < inStockSegments + lowStockSegments) {
    return "low-stock";
  }

  return "out-of-stock";
}

const gaugeSegments = Array.from({ length: gaugeSegmentCount }, (_, index) => {
  const status = getGaugeSegmentStatus(index);
  return {
    fill: `var(--color-${status})`,
    id: `segment-${index + 1}`,
    status,
    value: 1,
  };
});
export function Inventory() {
  const text = useMessages(ecommerceMessageKey).inventory;
  const locale = useLocale();
  const availablePercent = formatPercent(availableRatio, locale);
  const chartConfig = {
    "in-stock": { label: text.inStock, color: "var(--chart-2)" },
    "low-stock": { label: text.lowStock, color: "var(--chart-1)" },
    "out-of-stock": { label: text.outOfStock, color: "var(--destructive)" },
  } satisfies ChartConfig;
  const inventorySummary = [
    { icon: PackageCheck, label: text.inStock, value: chartData[0]["in-stock"] },
    { icon: TriangleAlert, label: text.lowStock, value: chartData[0]["low-stock"] },
    { icon: PackageX, label: text.out, value: chartData[0]["out-of-stock"] },
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-muted-foreground text-sm font-normal">{text.title}</CardTitle>
        <CardDescription className="text-foreground text-xl leading-none tracking-tight tabular-nums">
          {format(text.available, locale, { percent: availablePercent })}
        </CardDescription>
        <CardAction>
          <ArrowUpRight className="size-4" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ChartContainer config={chartConfig} className="mx-auto h-30 w-full">
          <PieChart>
            <Pie
              cx="50%"
              cy="100%"
              cornerRadius={6}
              data={gaugeSegments}
              dataKey="value"
              endAngle={0}
              innerRadius={80}
              outerRadius={110}
              paddingAngle={2}
              startAngle={180}
              stroke="var(--card)"
              strokeWidth={1}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text textAnchor="middle" x={viewBox.cx} y={viewBox.cy}>
                        <tspan
                          className="fill-foreground text-2xl font-medium tabular-nums"
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 22}
                        >
                          {availablePercent}
                        </tspan>
                        <tspan className="fill-muted-foreground text-xs" x={viewBox.cx} y={(viewBox.cy || 0) + 38}>
                          {text.availableLabel}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
        <Separator />

        <div className="grid grid-cols-3 divide-x">
          {inventorySummary.map((item, _index) => (
            <div key={item.label} className="flex min-w-0 flex-col items-center gap-3 px-1 text-center">
              <div className="bg-muted grid size-9 place-items-center rounded-full">
                <item.icon className="text-muted-foreground size-4" />
              </div>
              <div>
                <div className="text-muted-foreground text-xs leading-tight break-words hyphens-auto">{item.label}</div>
                <div className="text-sm font-medium tabular-nums">{formatNumber(item.value, locale)}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
