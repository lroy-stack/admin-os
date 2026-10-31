"use client";

import { Bar, CartesianGrid, ComposedChart, Dot, LabelList, Line, ReferenceLine, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  formatAmount,
  formatPercent,
  format as formatText,
  useCurrency,
  useLocale,
  useMessages,
} from "@/core/i18n/client";

import { forecastFigures, forecastWeeks } from "./analytics-data";
import { formatPoints } from "./analytics-format";
import { analyticsV1MessageKey } from "./messages";

const FORECAST_WEEKS = forecastWeeks.length;

export function DriversForecastTarget() {
  const text = useMessages(analyticsV1MessageKey);
  const t = text.forecast;
  const locale = useLocale();
  const currency = useCurrency();
  const weekLabel = (week: number | string) => formatText(t.weekShort, locale, { week: Number(week) });
  const percentValue = (value: number) => formatPercent(value / 100, locale);

  const forecastChartConfig = {
    closedWon: { label: t.closedWon, color: "var(--chart-1)" },
    weightedPipeline: { label: t.weightedPipeline, color: "var(--chart-2)" },
    target: { label: t.target, color: "var(--muted-foreground)" },
  } satisfies ChartConfig;

  const chartData = forecastWeeks.map((point) => ({
    ...point,
    deltaLabel:
      point.deltaPoints === undefined ? undefined : formatPoints(text.percentagePoints, point.deltaPoints, locale),
  }));
  const pipelineMin = Math.min(...forecastWeeks.map((point) => point.weightedPipeline));
  const pipelineMax = Math.max(...forecastWeeks.map((point) => point.weightedPipeline));

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{formatText(t.description, locale, { weeks: FORECAST_WEEKS })}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetricChip
            label={t.attainment}
            value={formatPercent(forecastFigures.attainment, locale, { minFractionDigits: 1, maxFractionDigits: 1 })}
            note={t.attainmentNote}
          />
          <MetricChip
            label={t.weightedPipeline}
            value={formatAmount(forecastFigures.weightedPipeline, currency, locale, { fractionDigits: 0 })}
            note={formatText(t.weightedPipelineNote, locale, {
              amount: formatAmount(forecastFigures.remaining, currency, locale, { fractionDigits: 0 }),
            })}
          />
          <MetricChip
            label={t.confidence}
            value={formatPercent(forecastFigures.confidence, locale, { minFractionDigits: 1, maxFractionDigits: 1 })}
            note={t.confidenceNote}
          />
        </div>
        <ChartContainer config={forecastChartConfig} className="h-68 w-full">
          <ComposedChart data={chartData} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.25} />
            <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={10} tickFormatter={weekLabel} />
            <YAxis
              tickFormatter={percentValue}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={52}
              domain={[0, "auto"]}
              ticks={[0, 50, 100, 150, 200]}
            />
            <YAxis yAxisId="pipeline" hide domain={[pipelineMin, pipelineMax]} />
            <ChartTooltip
              cursor={false}
              content={(props) => (
                <ChartTooltipContent
                  active={props.active}
                  label={props.label}
                  labelFormatter={(label) => weekLabel(label)}
                  className="w-52"
                  payload={(props.payload ?? []).map((item) => ({
                    ...item,
                    value:
                      typeof item.value === "number"
                        ? formatPercent(item.value / 100, locale, { minFractionDigits: 1, maxFractionDigits: 1 })
                        : item.value,
                  }))}
                />
              )}
            />
            <ReferenceLine y={100} stroke="var(--color-target)" strokeWidth={2} strokeDasharray="6 5" />
            <Bar
              dataKey="closedWon"
              name={t.closedWon}
              fill="var(--color-closedWon)"
              fillOpacity={0.22}
              stroke="var(--color-closedWon)"
              strokeOpacity={0.35}
              radius={[5, 5, 0, 0]}
              barSize={14}
            >
              <LabelList dataKey="deltaLabel" position="top" offset={8} fill="var(--color-closedWon)" />
            </Bar>
            <Line
              type="monotone"
              yAxisId="pipeline"
              dataKey="weightedPipeline"
              name={t.pipelineVsTarget}
              strokeOpacity={0}
              strokeWidth={0}
              stroke="var(--color-weightedPipeline)"
              isAnimationActive={false}
              dot={({ payload, ...props }) => (
                <Dot
                  key={`${payload.week}-weighted-pipeline`}
                  cx={props.cx}
                  cy={props.cy}
                  r={3.5}
                  fill="var(--color-weightedPipeline)"
                  stroke="var(--color-weightedPipeline)"
                  strokeWidth={7}
                  strokeOpacity={0.08}
                />
              )}
              activeDot={false}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function MetricChip({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="bg-muted/35 min-w-0 rounded-md border px-3 py-2.5">
      <p className="text-muted-foreground text-xs break-words hyphens-auto">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-muted-foreground text-xs break-words hyphens-auto">{note}</p>
    </div>
  );
}
