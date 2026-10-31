import { HandCoins } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getLocale, getMessages } from "@/config/locale.server";
import { format, formatPercent } from "@/core/i18n/client";

import { financeV1Messages } from "../messages.server";

export async function SavingsRate() {
  const [text, locale] = await Promise.all([getMessages(financeV1Messages), getLocale()]);
  const labels = text.kpis.savingsRate;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-2">
            <span className="bg-muted grid size-7 shrink-0 place-content-center rounded-sm">
              <HandCoins className="size-5" />
            </span>
            <span className="min-w-0 break-words">{labels.title}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center justify-between gap-x-2">
            <p className="text-xl font-medium tabular-nums">{formatPercent(0.32, locale)}</p>
            <span className="text-xs">
              {format(text.kpis.versusLastMonth, locale, {
                change: formatPercent(0.035, locale, { signed: true, minFractionDigits: 1, maxFractionDigits: 1 }),
              })}
            </span>
          </div>
          <p className="text-muted-foreground text-xs">{labels.period}</p>
        </div>

        <Separator />

        <p className="text-muted-foreground text-xs">{labels.note}</p>
      </CardContent>
    </Card>
  );
}
