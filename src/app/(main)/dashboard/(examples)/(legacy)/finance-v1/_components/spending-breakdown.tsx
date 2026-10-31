import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrency, getLocale, getMessages } from "@/config/locale.server";
import { format, formatAmount, formatPercent } from "@/core/i18n/client";

import type { SpendingCategory } from "./messages";
import { financeV1Messages } from "./messages.server";

const expenses: readonly { key: SpendingCategory; amount: number }[] = [
  { key: "housing", amount: 1650 },
  { key: "utilities", amount: 420 },
  { key: "groceries", amount: 560 },
  { key: "transportation", amount: 740 },
  { key: "subscriptions", amount: 260 },
  { key: "healthcare", amount: 390 },
  { key: "other", amount: 980 },
];

const total = expenses.reduce((sum, item) => sum + item.amount, 0);

function shade(index: number): string {
  const alpha = Math.max(0.35, 1 - index * 0.08);
  return `color-mix(in oklch, var(--primary) ${alpha * 100}%, transparent)`;
}

export async function SpendingBreakdown() {
  const [text, locale, currency] = await Promise.all([getMessages(financeV1Messages), getLocale(), getCurrency()]);
  const labels = text.spending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{labels.title}</CardTitle>
        <CardDescription>{labels.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="text-2xl font-medium tabular-nums">
            {formatAmount(total, currency, locale, { fractionDigits: 0 })}
          </div>
          <div className="flex h-6 w-full overflow-hidden rounded-md">
            {expenses.map((item, index) => (
              <div
                key={item.key}
                className="border-background h-full shrink-0 border-l first:border-l-0"
                style={{ width: `${(item.amount / total) * 100}%`, background: shade(index) }}
                title={format(labels.segment, locale, {
                  category: labels.categories[item.key],
                  amount: formatAmount(item.amount, currency, locale),
                })}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {expenses.map((item, index) => (
            <div key={item.key} className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <div className="size-3 shrink-0 rounded-sm" style={{ background: shade(index) }} />
                <span className="text-muted-foreground min-w-0 text-sm break-words">{labels.categories[item.key]}</span>
              </div>

              <span className="shrink-0 text-sm font-medium tabular-nums">
                {formatPercent(item.amount / total, locale)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
