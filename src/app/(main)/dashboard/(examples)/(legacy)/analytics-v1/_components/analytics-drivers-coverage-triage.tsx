import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrency, getLocale, getMessages } from "@/config/locale.server";
import { format, formatAmount, formatPercent } from "@/core/i18n/client";

import { coverageFigures } from "./analytics-data";
import { formatDays, formatMultiple, formatPoints, formatSignedAmount } from "./analytics-format";
import { analyticsV1Messages } from "./messages.server";

export async function DriversCoverageTriage() {
  const [locale, currency, text] = await Promise.all([getLocale(), getCurrency(), getMessages(analyticsV1Messages)]);
  const t = text.coverage;
  const { levers } = coverageFigures;
  const whole = { fractionDigits: 0 };

  const leverOptions = [
    {
      key: "deal",
      label: format(t.levers.deal, locale, { count: levers.enterpriseDeals.count }),
      value: format(t.levers.dealValue, locale, {
        amount: formatSignedAmount(levers.enterpriseDeals.weighted, currency, locale),
      }),
      share: levers.enterpriseDeals.share,
    },
    {
      key: "conversion",
      label: format(t.levers.conversion, locale, {
        points: formatPoints(text.percentagePoints, levers.conversion.points, locale, 0),
      }),
      value: format(t.levers.conversionValue, locale, {
        amount: formatSignedAmount(levers.conversion.perMonth, currency, locale),
      }),
      share: levers.conversion.share,
    },
    {
      key: "cycle",
      label: format(t.levers.cycle, locale, { days: formatDays(levers.cycle.days, locale, { signed: true }) }),
      value: format(t.levers.cycleValue, locale, {
        amount: formatSignedAmount(levers.cycle.perDay, currency, locale),
      }),
      share: levers.cycle.share,
    },
  ];
  const fastest = leverOptions[2];

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="destructive" className="rounded-md font-medium">
            {t.atRisk}
          </Badge>
          <Badge variant="outline" className="font-medium tabular-nums">
            {format(t.multiple, locale, {
              current: formatMultiple(coverageFigures.currentMultiple, locale),
              target: formatMultiple(coverageFigures.targetMultiple, locale),
            })}
          </Badge>
          <Badge variant="outline" className="font-medium tabular-nums">
            {format(t.gap, locale, { amount: formatAmount(coverageFigures.gap, currency, locale, whole) })}
          </Badge>
          <Badge variant="outline" className="h-auto font-medium whitespace-normal tabular-nums">
            {format(t.deals, locale, {
              count: coverageFigures.openDeals,
              days: formatDays(coverageFigures.etaDays, locale),
            })}
          </Badge>
        </div>

        <p className="text-muted-foreground text-xs">{t.summary}</p>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {leverOptions.map((lever) => (
            <div key={lever.key} className="bg-muted/20 min-w-0 space-y-1 rounded-md border px-2.5 py-2">
              <p className="text-muted-foreground text-xs break-words hyphens-auto">{lever.label}</p>
              <p className="text-sm font-semibold tabular-nums">{lever.value}</p>
              <p className="text-muted-foreground text-xs break-words">
                {format(t.levers.context, locale, { share: formatPercent(lever.share, locale) })}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-muted/20 flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className="text-muted-foreground flex gap-1">
              {t.owner}
              <span className="text-foreground font-medium">{coverageFigures.owner}</span>
            </span>
            <span className="text-muted-foreground flex gap-1">
              {t.focus}
              <span className="text-foreground">{t.focusValue}</span>
            </span>
            <span className="text-muted-foreground flex gap-1">
              {t.due}
              <span className="text-foreground">{t.dueValue}</span>
            </span>
          </div>
          <Button variant="secondary" size="sm" className="h-auto min-h-7 px-3 py-1 text-xs whitespace-normal" asChild>
            <Link href="/dashboard/crm">{format(t.openTopDeals, locale, { count: coverageFigures.topDeals })}</Link>
          </Button>
        </div>

        <div className="bg-muted/10 space-y-1 rounded-md border border-dashed px-3 py-2.5">
          <p className="text-muted-foreground text-xs">
            {format(t.fastestPath, locale, {
              lever: fastest?.label ?? "",
              share: formatPercent(levers.cycle.share, locale),
            })}
          </p>
          <p className="text-muted-foreground text-xs">{t.prioritySequence}</p>
        </div>
      </CardContent>
    </Card>
  );
}
