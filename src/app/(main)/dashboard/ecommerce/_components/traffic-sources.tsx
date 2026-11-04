"use client";

import { ArrowUpRight } from "lucide-react";
import { Bar, BarChart, LabelList, type LabelProps, XAxis, YAxis } from "recharts";
import { siEbay, siGoogle, siMeta, siShopify, siTiktok } from "simple-icons";

import { SimpleIcon } from "@/components/simple-icon";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import {
  format,
  formatCompact,
  formatNumber,
  formatPercent,
  type Locale,
  useLocale,
  useMessages,
} from "@/core/i18n/client";

import { useEcommerceFilters } from "./ecommerce-filters";
import { ecommerceMessageKey } from "./messages";
import type { EcommerceChannel } from "./order-view";

const trafficSources = [
  {
    name: "Meta",
    channel: "social",
    visits: 5640,
    share: 38,
    change: 0.18,
    icon: siMeta,
  },
  {
    name: "Google",
    channel: "onlineStore",
    visits: 3740,
    share: 25,
    change: -0.06,
    icon: siGoogle,
  },
  {
    name: "Shopify",
    channel: "onlineStore",
    visits: 2960,
    share: 20,
    change: 0.07,
    icon: siShopify,
  },
  {
    name: "TikTok",
    channel: "social",
    visits: 1340,
    share: 10,
    change: 0.09,
    icon: siTiktok,
  },
  {
    name: "eBay",
    channel: "marketplace",
    visits: 1080,
    share: 7,
    change: -0.03,
    icon: siEbay,
  },
] as const;

type TrafficSource = Omit<(typeof trafficSources)[number], "share"> & { readonly share: number };

/** The sources of a channel, with each share recomputed against what that channel brings. */
function sourcesFor(channel: EcommerceChannel): TrafficSource[] {
  const visible = trafficSources.filter((source) => channel === "all" || source.channel === channel);
  const total = visible.reduce((sum, source) => sum + source.visits, 0);
  return visible.map((source) => ({ ...source, share: total === 0 ? 0 : Math.round((source.visits / total) * 100) }));
}

type IconLabelProps = {
  sources: readonly TrafficSource[];
  height?: number | string;
  index?: number;
  width?: number | string;
  x?: number | string;
  y?: number | string;
};

type SourceLabelProps = LabelProps & {
  index?: number;
  locale: Locale;
  sources: readonly TrafficSource[];
};

type SourceChangeLabelProps = LabelProps & {
  locale: Locale;
  value?: number | string;
};

function getNumber(value: number | string | undefined) {
  return typeof value === "number" ? value : Number(value);
}

function TrafficSourceIconLabel({ height, index, sources, width, x, y }: IconLabelProps) {
  if (typeof index !== "number") {
    return null;
  }

  const source = sources[index];
  const xValue = getNumber(x);
  const yValue = getNumber(y);
  const widthValue = getNumber(width);
  const heightValue = getNumber(height);

  if (
    !source ||
    Number.isNaN(xValue) ||
    Number.isNaN(yValue) ||
    Number.isNaN(widthValue) ||
    Number.isNaN(heightValue)
  ) {
    return null;
  }

  const iconSize = 16;
  const iconX = Math.max(xValue + 10, xValue + widthValue - iconSize - 10);
  const iconY = yValue + (heightValue - iconSize) / 2;

  return (
    <foreignObject height={iconSize} x={iconX} y={iconY} width={iconSize}>
      <SimpleIcon icon={source.icon} className="fill-foreground size-4" />
    </foreignObject>
  );
}

function TrafficSourceNameLabel({ height, index, locale, sources, x, y }: SourceLabelProps) {
  if (typeof index !== "number") {
    return null;
  }

  const source = sources[index];
  const xValue = getNumber(x);
  const yValue = getNumber(y);
  const heightValue = getNumber(height);

  if (!source || Number.isNaN(xValue) || Number.isNaN(yValue) || Number.isNaN(heightValue)) {
    return null;
  }

  return (
    <text dominantBaseline="middle" textAnchor="start" x={2} y={yValue + heightValue / 2}>
      <tspan className="fill-foreground font-medium" fontSize={13} x={2} y={yValue + heightValue / 2 - 7}>
        {source.name}
      </tspan>
      <tspan className="fill-muted-foreground" fontSize={12} x={2} y={yValue + heightValue / 2 + 11}>
        {formatNumber(source.visits, locale)}
      </tspan>
    </text>
  );
}

function TrafficSourceChangeLabel({ height, locale, value, y }: SourceChangeLabelProps) {
  const yValue = getNumber(y);
  const heightValue = getNumber(height);

  if (typeof value !== "number" || Number.isNaN(yValue) || Number.isNaN(heightValue)) {
    return null;
  }

  const isNegative = value < 0;

  return (
    <text
      className={isNegative ? "fill-destructive" : "fill-green-700 dark:fill-green-300"}
      dominantBaseline="middle"
      dx={-6}
      fontSize={13}
      textAnchor="end"
      x="100%"
      y={yValue + heightValue / 2}
    >
      {formatPercent(value, locale, { signed: true })}
    </text>
  );
}

export function TrafficSources() {
  const text = useMessages(ecommerceMessageKey).sources;
  const locale = useLocale();
  const { channel } = useEcommerceFilters();
  const visible = sourcesFor(channel);
  const totalVisits = visible.reduce((sum, source) => sum + source.visits, 0);
  const trafficSourcesConfig = {
    share: { label: text.visitsSeries, color: "var(--chart-1)" },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-muted-foreground text-sm font-normal">{text.title}</CardTitle>
        <CardDescription className="text-foreground text-xl leading-none tracking-tight tabular-nums">
          {format(text.visits, locale, { count: totalVisits, value: formatCompact(totalVisits, locale) })}
        </CardDescription>
        <CardAction>
          <ArrowUpRight className="size-4" />
        </CardAction>
      </CardHeader>

      <CardContent>
        {visible.length === 0 ? (
          <p className="text-muted-foreground flex h-54 items-center justify-center text-center text-sm">
            {text.empty}
          </p>
        ) : (
          <ChartContainer config={trafficSourcesConfig} className="h-54 w-full">
            <BarChart
              accessibilityLayer
              barCategoryGap={12}
              data={visible}
              layout="vertical"
              margin={{ bottom: 0, left: 100, right: 50, top: 0 }}
            >
              <defs>
                <pattern
                  height="4"
                  id="ecommerce-traffic-source-background-pattern"
                  patternTransform="rotate(45)"
                  patternUnits="userSpaceOnUse"
                  width="4"
                >
                  <rect height="6" width="6" fill="var(--muted)" fillOpacity="0.5" />
                  <line
                    stroke="var(--muted-foreground)"
                    strokeOpacity="0.10"
                    strokeWidth="1.25"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="6"
                  />
                </pattern>
              </defs>
              <XAxis dataKey="share" domain={[0, 100]} hide type="number" />
              <YAxis dataKey="name" hide type="category" />
              <Bar
                background={{ fill: "url(#ecommerce-traffic-source-background-pattern)", radius: 8 }}
                barSize={36}
                dataKey="share"
                fill="var(--color-share)"
                fillOpacity={0.5}
                name={text.visitsSeries}
                radius={8}
                stroke="var(--color-share)"
                strokeOpacity={0.1}
                strokeWidth={0.5}
              >
                <LabelList content={<TrafficSourceNameLabel locale={locale} sources={visible} />} dataKey="name" />
                <LabelList content={<TrafficSourceIconLabel sources={visible} />} dataKey="share" />
                <LabelList content={<TrafficSourceChangeLabel locale={locale} />} dataKey="change" />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
