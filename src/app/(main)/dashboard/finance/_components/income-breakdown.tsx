import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getCurrency, getLocale, getMessages } from "@/config/locale.server";
import { format, formatAmount, formatPercent } from "@/core/i18n/client";

import { financeMessages } from "./messages.server";

const sources = [
  { id: "salary", amount: 4560, share: 0.68, bar: "bg-chart-3" },
  { id: "freelance", amount: 1412, share: 0.21, bar: "bg-chart-3/75" },
  { id: "investments", amount: 765, share: 0.11, bar: "bg-chart-3/50" },
] as const;

export async function IncomeBreakdown() {
  const [text, locale, currency] = await Promise.all([getMessages(financeMessages), getLocale(), getCurrency()]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">{text.income.title}</CardTitle>
      </CardHeader>

      <CardContent className="grid grid-cols-1 gap-1 md:grid-cols-3">
        {sources.map((source) => (
          <section key={source.id} className="isolate flex gap-[0.5px]">
            <Separator
              orientation="vertical"
              className="border-muted-foreground/50 mb-1 h-auto self-auto border-l border-dashed bg-transparent"
            />
            <div className="flex min-h-24 min-w-0 flex-1 flex-col justify-between gap-2">
              <div className="flex min-w-0 flex-col gap-1.5 px-1">
                <p className="text-muted-foreground text-xs leading-snug break-words hyphens-auto">
                  {format(text.income.share, locale, {
                    source: text.income.sources[source.id],
                    percent: formatPercent(source.share, locale),
                  })}
                </p>
                <div className="text-lg leading-none tracking-tight tabular-nums">
                  {formatAmount(source.amount, currency, locale)}
                </div>
              </div>
              <div className={`${source.bar} -ml-0.5 h-5 rounded-sm`} />
            </div>
          </section>
        ))}
      </CardContent>
    </Card>
  );
}
