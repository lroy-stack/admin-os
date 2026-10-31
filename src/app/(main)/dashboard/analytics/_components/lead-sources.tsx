"use client";

import { ArrowUpRight } from "lucide-react";
import { Pie, PieChart } from "recharts";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { format, formatNumber, formatPercent, useLocale, useMessages } from "@/core/i18n/client";
import type { LeadChannel } from "@/data/crm";
import { CardIconButton } from "@/ds/components";

import type { GrowthReport } from "./growth-data";
import { growthMessageKey } from "./messages";

const channelColors: Record<LeadChannel, string> = {
  Website: "var(--chart-1)",
  Referral: "var(--chart-2)",
  LinkedIn: "var(--chart-3)",
  Email: "color-mix(in oklab, var(--chart-1) 55%, transparent)",
  Events: "color-mix(in oklab, var(--chart-2) 55%, transparent)",
  WhatsApp: "var(--chart-4)",
};

export function LeadSources({ report }: { report: GrowthReport }) {
  const text = useMessages(growthMessageKey);
  const locale = useLocale();
  const chartConfig = Object.fromEntries(
    Object.entries(channelColors).map(([channel, color]) => [
      channel,
      { label: text.channels[channel as LeadChannel], color },
    ]),
  ) satisfies ChartConfig;
  const sources = report.leadSources
    .filter((source) => source.customers > 0)
    .map((source) => ({ ...source, fill: channelColors[source.channel] }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-normal">{text.leadSources.title}</CardTitle>
        <CardAction>
          <CardIconButton icon={ArrowUpRight} label={text.openCustomers} href="/dashboard/users" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <p className="text-muted-foreground max-w-xs text-xs leading-relaxed">
          {format(text.leadSources.intro, locale, { count: report.newCustomerCount, months: report.months })}
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
            <span className="text-2xl font-medium tabular-nums">{formatNumber(report.newCustomerCount, locale)}</span>
            <span className="text-muted-foreground text-[11px]">
              {format(text.leadSources.centerLabel, locale, { count: report.newCustomerCount })}
            </span>
          </div>
        </div>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
          {report.leadSources.map((source) => (
            <li key={source.channel} className="flex items-center gap-2">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: channelColors[source.channel] }}
              />
              <span className="text-foreground/80">{text.channels[source.channel]}</span>
              <span className="ml-auto tabular-nums">{formatNumber(source.customers, locale)}</span>
              <span className="text-muted-foreground w-12 text-right tabular-nums">
                {formatPercent(source.share, locale)}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
