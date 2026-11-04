"use client";

import { Bar, BarChart, CartesianGrid, Label, LabelList, Pie, PieChart, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  formatNumber,
  formatPercent,
  format as formatText,
  useChartFormatters,
  useLocale,
  useMessages,
} from "@/core/i18n/client";
import { CurrencyTooltipContent } from "@/ds/components";
import { downloadCsv, toCsv } from "@/lib/csv";

import { leadSourceColors, leadsBySourceChartData, projectRevenueChartData, projectRevenueSummary } from "./crm.config";
import { crmV1MessageKey } from "./messages";

const LEADS_BY_SOURCE_FILE = "leads-by-source.csv";

export function InsightCards() {
  const text = useMessages(crmV1MessageKey);
  const t = text.insights;
  const locale = useLocale();
  const fmt = useChartFormatters();
  const totalLeads = leadsBySourceChartData.reduce((acc, curr) => acc + curr.leads, 0);

  const leadsBySourceChartConfig = {
    leads: { label: t.leads },
    website: { label: text.sources.website, color: leadSourceColors.website },
    referral: { label: text.sources.referral, color: leadSourceColors.referral },
    social: { label: text.sources.social, color: leadSourceColors.social },
    cold: { label: text.sources.cold, color: leadSourceColors.cold },
    other: { label: text.sources.other, color: leadSourceColors.other },
  } satisfies ChartConfig;
  const projectRevenueChartConfig = {
    actual: { label: t.actual, color: "var(--chart-1)" },
    remaining: { label: t.remaining, color: "var(--chart-2)" },
    label: { color: "var(--primary-foreground)" },
  } satisfies ChartConfig;

  const pieData = leadsBySourceChartData.map((item) => ({ ...item, fill: `var(--color-${item.source})` }));
  const projectData = projectRevenueChartData.map((row) => ({ ...row, name: t.projects[row.project] }));

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs sm:grid-cols-2 xl:grid-cols-5">
      <Card className="col-span-1 xl:col-span-2">
        <CardHeader>
          <CardTitle>{t.leadsBySource}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <ChartContainer config={leadsBySourceChartConfig} className="mx-auto aspect-square max-h-48 flex-1">
            <PieChart
              className="m-0"
              margin={{
                top: 0,
                right: 0,
                left: 0,
                bottom: 0,
              }}
            >
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={pieData}
                dataKey="leads"
                nameKey="source"
                innerRadius={65}
                outerRadius={90}
                paddingAngle={2}
                cornerRadius={4}
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-3xl font-bold tabular-nums"
                          >
                            {formatNumber(totalLeads, locale)}
                          </tspan>
                          <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground">
                            {t.leads}
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>

          <ul className="flex min-w-0 flex-col gap-3">
            {leadsBySourceChartData.map((item) => (
              <li key={item.source} className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2 text-xs">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: leadSourceColors[item.source] }}
                  />
                  <span className="min-w-0 break-words">{leadsBySourceChartConfig[item.source].label}</span>
                </span>
                <span className="shrink-0 text-xs tabular-nums">{formatNumber(item.leads, locale)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-auto min-h-8 w-full py-1 whitespace-normal"
            onClick={() =>
              downloadCsv(
                LEADS_BY_SOURCE_FILE,
                toCsv(leadsBySourceChartData, [
                  { header: t.leadsBySource, value: (row) => text.sources[row.source] },
                  { header: t.leads, value: (row) => row.leads },
                ]),
              )
            }
          >
            {t.downloadCsv}
          </Button>
        </CardFooter>
      </Card>

      <Card className="col-span-1 xl:col-span-3">
        <CardHeader>
          <CardTitle>{t.projectRevenue}</CardTitle>
        </CardHeader>
        <CardContent className="size-full max-h-52">
          <ChartContainer config={projectRevenueChartConfig} className="size-full">
            <BarChart accessibilityLayer data={projectData} layout="vertical">
              <CartesianGrid horizontal={false} />
              <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} hide />
              <XAxis dataKey="actual" type="number" hide />
              <ChartTooltip cursor={false} content={<CurrencyTooltipContent indicator="line" />} />
              <Bar stackId="a" dataKey="actual" name={t.actual} fill="var(--color-actual)">
                <LabelList
                  dataKey="name"
                  position="insideLeft"
                  offset={8}
                  className="fill-primary-foreground text-xs"
                />
                <LabelList
                  dataKey="actual"
                  position="insideRight"
                  offset={8}
                  className="fill-primary-foreground text-xs tabular-nums"
                  formatter={(value: unknown) => fmt.compact(Number(value))}
                />
              </Bar>
              <Bar
                stackId="a"
                dataKey="remaining"
                name={t.remaining}
                fill="var(--color-remaining)"
                radius={[0, 6, 6, 0]}
              >
                <LabelList
                  dataKey="remaining"
                  position="insideRight"
                  offset={8}
                  className="fill-primary-foreground text-xs tabular-nums"
                  formatter={(value: unknown) => fmt.compact(Number(value))}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
        <CardFooter>
          <p className="text-muted-foreground text-xs">
            {formatText(t.projectSummary, locale, {
              progress: formatPercent(projectRevenueSummary.averageProgress, locale),
              count: projectRevenueSummary.aboveTarget,
            })}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
