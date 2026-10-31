"use client";

import { cn } from "cn";
import { Clock } from "lucide-react";
import { Funnel, FunnelChart, LabelList } from "recharts";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  formatAmount,
  formatNumber,
  formatPercent,
  format as formatText,
  useCurrency,
  useLocale,
  useMessages,
} from "@/core/i18n/client";

import { actionItems, pipelineLeadsChange, regionSalesData, salesPipelineChartData } from "./crm.config";
import { crmV1MessageKey } from "./messages";

const priorityTone = {
  high: "bg-destructive/20 text-destructive",
  medium: "bg-yellow-500/20 text-yellow-500",
  low: "bg-green-500/20 text-green-500",
} as const;

export function OperationalCards() {
  const text = useMessages(crmV1MessageKey).operations;
  const locale = useLocale();
  const currency = useCurrency();
  const money = (amount: number) => formatAmount(amount, currency, locale, { fractionDigits: 0 });

  const totalSales = regionSalesData.reduce((sum, region) => sum + region.sales, 0);
  const growingRegions = regionSalesData.filter((region) => region.growth > 0).length;
  const pipelineChartConfig = {
    value: { label: text.pipelineStages.leads, color: "var(--chart-1)" },
    stage: { label: text.salesPipeline },
  } satisfies ChartConfig;
  const pipelineData = salesPipelineChartData.map((row) => ({
    ...row,
    stage: text.pipelineStages[row.stage],
    amount: formatNumber(row.value, locale),
  }));

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs sm:grid-cols-2 xl:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>{text.salesPipeline}</CardTitle>
        </CardHeader>
        <CardContent className="size-full">
          <ChartContainer config={pipelineChartConfig} className="size-full">
            <FunnelChart margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
              <Funnel className="stroke-card stroke-2" dataKey="value" data={pipelineData}>
                <LabelList className="fill-foreground stroke-0" dataKey="stage" position="right" offset={10} />
                <LabelList className="fill-foreground stroke-0" dataKey="amount" position="left" offset={10} />
              </Funnel>
            </FunnelChart>
          </ChartContainer>
        </CardContent>
        <CardFooter>
          <p className="text-muted-foreground text-xs">
            {formatText(text.pipelineIncrease, locale, {
              change: formatPercent(pipelineLeadsChange, locale, { minFractionDigits: 1, maxFractionDigits: 1 }),
            })}
          </p>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{text.salesByRegion}</CardTitle>
          <CardDescription className="font-medium tabular-nums">{money(totalSales)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            {regionSalesData.map((region) => (
              <div key={region.region} className="space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 text-sm font-medium break-words">{text.regions[region.region]}</span>
                  <div className="flex shrink-0 items-baseline gap-1">
                    <span className="text-sm font-semibold tabular-nums">{money(region.sales)}</span>
                    <span
                      className={cn(
                        "text-xs font-medium tabular-nums",
                        region.growth > 0 ? "text-green-500" : "text-destructive",
                      )}
                    >
                      {formatPercent(region.growth, locale, {
                        signed: true,
                        minFractionDigits: 1,
                        maxFractionDigits: 1,
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={region.share * 100} />
                  <span className="text-muted-foreground shrink-0 text-xs font-medium tabular-nums">
                    {formatPercent(region.share, locale)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <div className="text-muted-foreground flex flex-wrap justify-between gap-x-2 gap-y-1 text-xs">
            <span>{formatText(text.regionsTracked, locale, { count: regionSalesData.length })}</span>
            <span aria-hidden="true" className="bg-border my-0.5 w-px self-stretch" />
            <span>{formatText(text.regionsGrowing, locale, { count: growingRegions })}</span>
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{text.actionItems}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2.5">
            {actionItems.map((item) => (
              <li key={item.id} className="space-y-2 rounded-md border px-3 py-2">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Checkbox defaultChecked={item.checked} aria-label={text.actions[item.id].title} />
                  <span className="min-w-0 text-sm font-medium break-words">{text.actions[item.id].title}</span>
                  <span className={cn("w-fit rounded-md px-2 py-1 text-xs font-medium", priorityTone[item.priority])}>
                    {text.priorities[item.priority]}
                  </span>
                </div>
                <div className="text-muted-foreground text-xs font-medium break-words">
                  {text.actions[item.id].description}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="text-muted-foreground size-3 shrink-0" />
                  <span className="text-muted-foreground text-xs font-medium">{text.due[item.due]}</span>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
