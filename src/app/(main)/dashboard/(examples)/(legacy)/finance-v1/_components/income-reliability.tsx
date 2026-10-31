import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getCurrency, getLocale, getMessages } from "@/config/locale.server";
import { format, formatAmount } from "@/core/i18n/client";

import { financeV1Messages } from "./messages.server";

const MONTHS_OBSERVED = 6;

export async function IncomeReliability() {
  const [text, locale, currency] = await Promise.all([getMessages(financeV1Messages), getLocale(), getCurrency()]);
  const labels = text.reliability;
  const amount = (value: number) => formatAmount(value, currency, locale, { fractionDigits: 0 });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{labels.title}</CardTitle>
        <CardDescription>{labels.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Separator />
        <div className="space-y-0.5">
          <p className="text-xl font-medium">{labels.level}</p>
          <p className="text-muted-foreground text-xs">{format(labels.basis, locale, { count: MONTHS_OBSERVED })}</p>
        </div>
        <Separator />
        <div className="flex justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            <p className="text-lg font-medium break-words">{labels.fixed.title}</p>
            <p className="text-muted-foreground text-xs">{labels.fixed.description}</p>
          </div>
          <p className="shrink-0 text-lg font-medium tabular-nums">{amount(90000)}</p>
        </div>
        <Separator />
        <div className="flex justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            <p className="text-lg font-medium break-words">{labels.variable.title}</p>
            <p className="text-muted-foreground text-xs">{labels.variable.description}</p>
          </div>
          <p className="shrink-0 text-lg font-medium tabular-nums">{amount(46500)}</p>
        </div>
        <Separator />
        <p className="text-muted-foreground text-xs">
          {labels.trend} <span className="text-primary font-medium">{labels.stable}</span>
        </p>
      </CardContent>
    </Card>
  );
}
