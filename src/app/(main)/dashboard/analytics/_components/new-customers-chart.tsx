"use client";

import { ArrowUpRight } from "lucide-react";
import { Bar, BarChart, XAxis } from "recharts";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { CardIconButton } from "@/ds/components";

import type { GrowthReport } from "./growth-data";

const chartConfig = {
  customers: { label: "New customers", color: "var(--color-brand)" },
} satisfies ChartConfig;

export function NewCustomersChart({ report }: { report: GrowthReport }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-normal">New customers per month</CardTitle>
        <CardAction>
          <CardIconButton icon={ArrowUpRight} label="Open customers" href="/dashboard/users" />
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-44 w-full">
          <BarChart data={report.newCustomers} barCategoryGap="22%" margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} interval={0} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideIndicator />} />
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
