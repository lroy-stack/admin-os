import { Calendar, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getCurrency, getLocale, getMessages } from "@/config/locale.server";
import { format, formatAmount, formatPercent } from "@/core/i18n/client";

import { financeV1Messages } from "../messages.server";

export async function MonthlyCashFlow() {
  const [text, locale, currency] = await Promise.all([getMessages(financeV1Messages), getLocale(), getCurrency()]);
  const labels = text.kpis.monthlyCashFlow;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-2">
            <span className="bg-muted grid size-7 shrink-0 place-content-center rounded-sm">
              <Calendar className="size-5" />
            </span>
            <span className="min-w-0 break-words">{labels.title}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-0.5">
          <p className="text-xl font-medium tabular-nums">
            {`+${formatAmount(2780, currency, locale, { fractionDigits: 0 })}`}
          </p>
          <p className="text-muted-foreground text-xs">{labels.period}</p>
        </div>

        <Separator />
        <p className="text-muted-foreground flex items-center gap-1 text-xs">
          <TrendingUp aria-hidden="true" className="size-4 shrink-0" />
          {format(text.kpis.versusLastMonth, locale, {
            change: formatPercent(0.041, locale, { minFractionDigits: 1, maxFractionDigits: 1 }),
          })}
        </p>
      </CardContent>
    </Card>
  );
}
