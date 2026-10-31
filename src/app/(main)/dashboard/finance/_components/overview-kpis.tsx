import { cn } from "cn";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrency, getLocale, getMessages } from "@/config/locale.server";
import { format, formatAmount, formatPercent } from "@/core/i18n/client";

import { financeMessages } from "./messages.server";

const POSITIVE = "bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300";

export async function OverviewKpis() {
  const [text, locale, currency] = await Promise.all([getMessages(financeMessages), getLocale(), getCurrency()]);
  const amount = (value: number, compact = false) =>
    formatAmount(value, currency, locale, compact ? { compact } : { fractionDigits: 0 });
  const change = (ratio: number) => formatPercent(ratio, locale, { signed: true, fractionDigits: 1 });
  const kpis = text.kpis;

  return (
    <div className="bg-card ring-foreground/10 overflow-hidden rounded-xl ring-1">
      <div className="grid grid-cols-1 xl:grid-cols-8">
        <Card className="border-foreground/10 gap-5 overflow-hidden rounded-none border-0 border-b ring-0 xl:col-span-4 xl:border-r">
          <CardHeader>
            <CardTitle className="font-normal">{kpis.netWorth}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="text-3xl leading-none tracking-tight tabular-nums">{amount(128_400, true)}</div>
              <p className="text-muted-foreground text-xs break-words">
                {format(kpis.netWorthChange, locale, { amount: amount(9_800, true) })}
              </p>
            </div>
            <Badge className={cn("shrink-0", POSITIVE)}>{change(0.084)}</Badge>
          </CardContent>
        </Card>

        <Card className="border-foreground/10 gap-5 overflow-hidden rounded-none border-0 border-b ring-0 xl:col-span-4">
          <CardHeader>
            <CardTitle className="font-normal">{kpis.availableCash}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <div className="text-3xl leading-none tracking-tight tabular-nums">{amount(12_800, true)}</div>
              <p className="text-muted-foreground text-xs break-words">
                {format(kpis.availableCashChange, locale, { amount: amount(410), days: 30 })}
              </p>
            </div>
            <Badge className={cn("shrink-0", POSITIVE)}>{change(0.032)}</Badge>
          </CardContent>
        </Card>

        <Card className="border-foreground/10 gap-5 overflow-hidden rounded-none border-0 ring-0 xl:col-span-4 xl:border-r">
          <CardHeader>
            <CardTitle className="font-normal">{kpis.monthlySpend}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <div className="text-3xl leading-none tracking-tight tabular-nums">{amount(2_140)}</div>
              <p className="text-muted-foreground text-xs break-words">
                {format(kpis.monthlySpendChange, locale, { amount: amount(124) })}
              </p>
            </div>
            <Badge variant="destructive" className="bg-destructive/10 text-destructive shrink-0">
              {change(0.061)}
            </Badge>
          </CardContent>
        </Card>

        <Card className="gap-5 overflow-hidden rounded-none border-0 ring-0 xl:col-span-4">
          <CardHeader>
            <CardTitle className="font-normal">{kpis.savingsRate}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <div className="text-3xl leading-none tracking-tight tabular-nums">{formatPercent(0.28, locale)}</div>
              <p className="text-muted-foreground text-xs break-words">
                {format(kpis.savingsRateChange, locale, {
                  percent: formatPercent(0.256, locale, { fractionDigits: 1 }),
                })}
              </p>
            </div>
            <Badge className={cn("shrink-0", POSITIVE)}>{change(0.024)}</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
