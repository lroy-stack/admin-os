"use client";

import { ArrowUpRight } from "lucide-react";
import { Bar, BarChart, XAxis } from "recharts";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useChartFormatters, useMessages } from "@/core/i18n/client";
import { CardIconButton } from "@/ds/components";

import type { GrowthReport } from "./growth-data";
import { growthMessageKey } from "./messages";

export function NewCustomersChart({ report }: { report: GrowthReport }) {
  const text = useMessages(growthMessageKey);
  const fmt = useChartFormatters();
  const chartConfig = {
    customers: { label: text.newCustomers.series, color: "var(--color-brand)" },
  } satisfies ChartConfig;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-normal">{text.newCustomers.title}</CardTitle>
        <CardAction>
          <CardIconButton icon={ArrowUpRight} label={text.openCustomers} href="/dashboard/customers" />
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-44 w-full">
          <BarChart data={report.newCustomers} barCategoryGap="22%" margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={0}
              tickFormatter={(month: string) => fmt.month(month)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideIndicator labelFormatter={(label) => fmt.month(String(label))} />}
            />
            <Bar
              dataKey="customers"
              fill="var(--color-customers)"
              radius={8}
              background={{ fill: "var(--foreground)", fillOpacity: 0.04, radius: 8 }}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
