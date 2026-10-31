"use client";

import { ArrowUpRight } from "lucide-react";
import { Pie, PieChart } from "recharts";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { LeadChannel } from "@/data/crm";
import { CardIconButton } from "@/ds/components";

import type { GrowthReport } from "./growth-data";

const channelColors: Record<LeadChannel, string> = {
  Website: "var(--chart-1)",
  Referral: "var(--chart-2)",
  LinkedIn: "var(--chart-3)",
  Email: "color-mix(in oklab, var(--chart-1) 55%, transparent)",
  Events: "color-mix(in oklab, var(--chart-2) 55%, transparent)",
  WhatsApp: "var(--chart-4)",
};

const chartConfig = Object.fromEntries(
  Object.entries(channelColors).map(([channel, color]) => [channel, { label: channel, color }]),
) satisfies ChartConfig;

export function LeadSources({ report }: { report: GrowthReport }) {
  const sources = report.leadSources
    .filter((source) => source.customers > 0)
    .map((source) => ({ ...source, fill: channelColors[source.channel] }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-normal">Lead sources</CardTitle>
        <CardAction>
          <CardIconButton icon={ArrowUpRight} label="Open customers" href="/dashboard/users" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <p className="text-muted-foreground max-w-xs text-xs leading-relaxed">
          How the {report.newCustomerCount} customers who joined in the last {report.months} months reached us. One
          customer can come through several channels.
        </p>
        <div className="relative mx-auto size-44">
          <ChartContainer config={chartConfig} className="aspect-square size-full">
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="channel" />} />
              <Pie
                data={sources}
                dataKey="customers"
                nameKey="channel"
                innerRadius="72%"
                outerRadius="92%"
                paddingAngle={4}
                cornerRadius={6}
                stroke="none"
              />
            </PieChart>
          </ChartContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-medium tabular-nums">{report.newCustomerCount}</span>
            <span className="text-muted-foreground text-[11px]">new customers</span>
          </div>
        </div>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
          {report.leadSources.map((source) => (
            <li key={source.channel} className="flex items-center gap-2">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: channelColors[source.channel] }}
              />
              <span className="text-foreground/80">{source.channel}</span>
              <span className="ml-auto tabular-nums">{source.customers}</span>
              <span className="text-muted-foreground w-8 text-right tabular-nums">{source.share}%</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
