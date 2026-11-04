"use client";

import * as React from "react";

import { cn } from "cn";
import { eachDayOfInterval, startOfDay, subDays } from "date-fns";
import { Check, ChevronsUpDown, Download } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Area, ComposedChart, XAxis, YAxis } from "recharts";

import { DateRangePicker } from "@/components/date-range-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  formatAmount,
  formatNumber,
  formatPercent,
  format as formatText,
  useChartFormatters,
  useCurrency,
  useLocale,
  useMessages,
} from "@/core/i18n/client";
import { CurrencyTooltipContent } from "@/ds/components";
import { downloadCsv, toCsv } from "@/lib/csv";

import {
  type FilterToggleKey,
  filterToggleKeys,
  overviewFigures,
  RISK_LADDER_WINDOW,
  type RiskView,
  riskViews,
} from "./analytics-data";
import { formatDays, formatPoints, formatSignedAmount } from "./analytics-format";
import { analyticsV1MessageKey } from "./messages";

const STALLED_THRESHOLD_DAYS = 14;
const REVENUE_FILE = "revenue.csv";

/** A calendar day as an ISO key ("2026-10-31"), built from the local parts the date picker produced. */
function isoDay(day: Date) {
  const month = String(day.getMonth() + 1).padStart(2, "0");
  const date = String(day.getDate()).padStart(2, "0");
  return `${day.getFullYear()}-${month}-${date}`;
}

function buildRevenueChartData(from: Date, to: Date) {
  const days = eachDayOfInterval({ start: from, end: to });
  const minRevenue = 22_000;
  const maxRevenue = 32_000;
  let currentRevenue = 27_500;

  return days.map((day) => {
    const nextRevenue = currentRevenue + Math.round((Math.random() - 0.45) * 4_000);
    currentRevenue = Math.max(minRevenue, Math.min(maxRevenue, nextRevenue));

    return {
      day: isoDay(day),
      revenue: currentRevenue,
    };
  });
}

export function AnalyticsOverview() {
  const text = useMessages(analyticsV1MessageKey).overview;
  const currency = useCurrency();
  const [dateRange, setDateRange] = React.useState<{ from: Date; to: Date }>(() => {
    const to = startOfDay(new Date());
    return { from: subDays(to, 29), to };
  });
  const [selectedFilters, setSelectedFilters] = React.useState<FilterToggleKey[]>(["includeRenewals"]);
  const [revenueSeries, setRevenueSeries] = React.useState(() => buildRevenueChartData(dateRange.from, dateRange.to));

  const handleFilterToggle = (key: FilterToggleKey, checked: boolean) => {
    setSelectedFilters((prev) => {
      if (checked) {
        return prev.includes(key) ? prev : [...prev, key];
      }
      return prev.filter((item) => item !== key);
    });
  };

  const handleDateRangeChange = (value: DateRange | undefined) => {
    if (!value?.from || !value?.to) {
      return;
    }
    const nextDateRange = { from: value.from, to: value.to };
    setDateRange(nextDateRange);
    setRevenueSeries(buildRevenueChartData(nextDateRange.from, nextDateRange.to));
  };
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <RiskViewSelect />
          <FiltersPopover selectedFilters={selectedFilters} onToggle={handleFilterToggle} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DateRangePicker value={dateRange} onChange={handleDateRangeChange} />
          <Button
            variant="secondary"
            onClick={() =>
              downloadCsv(
                REVENUE_FILE,
                toCsv(revenueSeries, [
                  { header: text.day, value: (point) => point.day },
                  { header: `${text.revenue} (${currency})`, value: (point) => point.revenue },
                ]),
              )
            }
          >
            <Download />
            {text.export}
          </Button>
        </div>
      </div>

      <SummaryRow revenueSeries={revenueSeries} />
    </div>
  );
}

function SummaryRow({ revenueSeries }: { revenueSeries: Array<{ day: string; revenue: number }> }) {
  const text = useMessages(analyticsV1MessageKey);
  const locale = useLocale();
  const currency = useCurrency();
  const fmt = useChartFormatters();
  const t = text.overview;
  const whole = { fractionDigits: 0 };

  const revenueChartConfig = {
    revenue: {
      label: t.revenue,
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  const revenueValues = revenueSeries.map((point) => point.revenue);
  const minRevenue = Math.min(...revenueValues);
  const maxRevenue = Math.max(...revenueValues);
  const midpoint = (minRevenue + maxRevenue) / 2;
  const halfRange = Math.max((maxRevenue - minRevenue) * 1.6, 4_500);

  const metrics = [
    { key: "stalled", label: t.metrics.stalled, value: formatNumber(overviewFigures.stalledDeals, locale) },
    {
      key: "risk",
      label: t.metrics.revenueAtRisk,
      value: formatAmount(overviewFigures.revenueAtRisk, currency, locale, whole),
    },
    {
      key: "win-rate",
      label: t.metrics.winRateTrend,
      value: formatPoints(text.percentagePoints, overviewFigures.winRateTrendPoints, locale),
    },
    {
      key: "cycle",
      label: t.metrics.cycleDrift,
      value: formatDays(overviewFigures.cycleDriftDays, locale, { display: "long", signed: true, digits: 1 }),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <div className="min-w-0 space-y-2">
        <div>
          <div className="text-muted-foreground text-sm font-medium">{t.revenue}</div>
          <div className="text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
            {formatAmount(overviewFigures.revenue, currency, locale, whole)}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            {formatPercent(overviewFigures.revenueChange, locale, {
              signed: true,
              minFractionDigits: 1,
              maxFractionDigits: 1,
            })}
          </Badge>
          <Badge variant="secondary">{formatSignedAmount(overviewFigures.revenueDelta, currency, locale)}</Badge>
        </div>

        <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
          <span>
            {formatText(t.previous, locale, {
              amount: formatAmount(overviewFigures.previousRevenue, currency, locale, whole),
            })}
          </span>
          <Badge variant="outline" className="h-auto text-xs font-medium whitespace-normal">
            {formatText(text.riskLadder, locale, { window: RISK_LADDER_WINDOW })}
          </Badge>
        </div>
        <div>
          <ChartContainer config={revenueChartConfig} className="h-10 w-full rounded-md border">
            <ComposedChart data={revenueSeries} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
              <XAxis dataKey="day" hide />
              <YAxis hide domain={[midpoint - halfRange, midpoint + halfRange]} />
              <ChartTooltip
                cursor={false}
                content={<CurrencyTooltipContent labelFormatter={(label) => fmt.day(String(label))} />}
              />
              <Area
                dataKey="revenue"
                name={t.revenue}
                type="natural"
                fill="var(--color-revenue)"
                fillOpacity={0.14}
                stroke="var(--color-revenue)"
              />
            </ComposedChart>
          </ChartContainer>
          <span className="text-muted-foreground text-xs">{t.selectedRange}</span>
        </div>
      </div>

      <Card className="min-w-0 py-4 shadow-xs xl:col-span-2">
        <CardHeader className="px-4">
          <CardTitle>{t.riskSummary}</CardTitle>
          <CardDescription>{t.riskSummaryDescription}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-0 xl:divide-x xl:[&>div]:px-5 xl:[&>div:first-child]:pl-0 xl:[&>div:last-child]:pr-0">
          {metrics.map((item) => (
            <div key={item.key} className="min-w-0 space-y-1">
              <div className="text-muted-foreground text-sm break-words hyphens-auto">{item.label}</div>
              <div className="text-2xl leading-tight font-semibold tabular-nums">{item.value}</div>
              <div className="text-muted-foreground text-xs">{t.versusPrevious}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function RiskViewSelect() {
  const text = useMessages(analyticsV1MessageKey).overview;
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<RiskView>("riskView");
  const listId = React.useId();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-label={text.viewLabel}
          aria-controls={listId}
          aria-expanded={open}
          className="min-w-54 justify-between"
        >
          <div className="flex items-center gap-2">
            <div
              className="bg-primary size-2 rounded-full"
              style={{
                boxShadow: "0 0 8px color-mix(in oklab, var(--primary) 50%, transparent)",
              }}
            />
            {text.views[value].label}
          </div>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto min-w-54 p-0">
        <Command>
          <CommandList id={listId}>
            <CommandGroup>
              {riskViews.map((view) => (
                <CommandItem
                  key={view}
                  value={view}
                  onSelect={(currentValue) => {
                    setValue(currentValue as RiskView);
                    setOpen(false);
                  }}
                >
                  <div className="flex min-w-0 flex-col">
                    <span>{text.views[view].label}</span>
                    <span className="text-muted-foreground text-xs">{text.views[view].description}</span>
                  </div>
                  <Check className={cn("ml-auto shrink-0", value === view ? "opacity-100" : "opacity-0")} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function FiltersPopover({
  selectedFilters,
  onToggle,
}: {
  selectedFilters: FilterToggleKey[];
  onToggle: (key: FilterToggleKey, checked: boolean) => void;
}) {
  const text = useMessages(analyticsV1MessageKey);
  const locale = useLocale();
  const [open, setOpen] = React.useState(false);
  const activeCount = selectedFilters.length;
  const summary =
    selectedFilters.length === 0
      ? text.overview.allDeals
      : filterToggleKeys
          .filter((key) => selectedFilters.includes(key))
          .map((key) => text.overview.filterOptions[key].summary)
          .join(" · ");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" aria-expanded={open}>
            {text.overview.filters}
            <Badge className="tabular-nums" variant="secondary">
              {activeCount}
            </Badge>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 max-w-[calc(100vw-2rem)]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{text.overview.filters}</h3>
              <Badge variant="outline" className="h-auto text-xs font-medium whitespace-normal tabular-nums">
                {formatText(text.riskLadder, locale, { window: RISK_LADDER_WINDOW })}
              </Badge>
            </div>
            <div className="space-y-3">
              {filterToggleKeys.map((key) => (
                <FilterToggle
                  key={key}
                  id={key}
                  label={formatText(text.overview.filterOptions[key].label, locale, {
                    days: STALLED_THRESHOLD_DAYS,
                  })}
                  checked={selectedFilters.includes(key)}
                  onCheckedChange={(checked) => onToggle(key, checked)}
                />
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <span className="text-muted-foreground flex min-w-0 gap-1 text-sm">
        {text.overview.showing}
        <span className="min-w-0 font-medium break-words">{summary}</span>
      </span>
    </div>
  );
}

function FilterToggle({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex cursor-pointer items-center gap-2">
      <Checkbox id={id} checked={checked} onCheckedChange={(value) => onCheckedChange(Boolean(value))} />
      <Label htmlFor={id} className="cursor-pointer text-sm font-normal">
        {label}
      </Label>
    </div>
  );
}
