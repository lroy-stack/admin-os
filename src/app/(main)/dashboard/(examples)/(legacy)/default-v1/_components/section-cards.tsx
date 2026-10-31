import { TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrency, getLocale } from "@/config/locale.server";
import { format, formatAmount, formatNumber, formatPercent } from "@/core/i18n/client";

import { defaultV1Messages } from "./messages.server";

// Demo figures: the business's books in the selected currency, nothing is converted.
const TOTAL_REVENUE = 1250;
const NEW_CUSTOMERS = 1234;
const ACTIVE_ACCOUNTS = 45_678;
const GROWTH_RATE = 0.045;
const CAPTION_MONTHS = 6;

export async function SectionCards() {
  const [locale, currency] = await Promise.all([getLocale(), getCurrency()]);
  const text = defaultV1Messages[locale].cards;
  const cards = [
    {
      key: "revenue",
      label: text.totalRevenue.label,
      value: formatAmount(TOTAL_REVENUE, currency, locale, { fractionDigits: 2 }),
      change: formatPercent(0.125, locale, { signed: true, minFractionDigits: 1, maxFractionDigits: 1 }),
      up: true,
      trend: text.totalRevenue.trend,
      caption: format(text.totalRevenue.caption, locale, { count: CAPTION_MONTHS }),
    },
    {
      key: "customers",
      label: text.newCustomers.label,
      value: formatNumber(NEW_CUSTOMERS, locale),
      change: formatPercent(-0.2, locale, { signed: true }),
      up: false,
      trend: format(text.newCustomers.trend, locale, { change: formatPercent(0.2, locale) }),
      caption: text.newCustomers.caption,
    },
    {
      key: "accounts",
      label: text.activeAccounts.label,
      value: formatNumber(ACTIVE_ACCOUNTS, locale),
      change: formatPercent(0.125, locale, { signed: true, minFractionDigits: 1, maxFractionDigits: 1 }),
      up: true,
      trend: text.activeAccounts.trend,
      caption: text.activeAccounts.caption,
    },
    {
      key: "growth",
      label: text.growthRate.label,
      value: formatPercent(GROWTH_RATE, locale, { minFractionDigits: 1, maxFractionDigits: 1 }),
      change: formatPercent(GROWTH_RATE, locale, { signed: true, minFractionDigits: 1, maxFractionDigits: 1 }),
      up: true,
      trend: text.growthRate.trend,
      caption: text.growthRate.caption,
    },
  ];

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {cards.map((card) => {
        const TrendIcon = card.up ? TrendingUp : TrendingDown;
        return (
          <Card key={card.key} className="@container/card min-w-0">
            <CardHeader>
              <CardDescription className="break-words hyphens-auto">{card.label}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{card.value}</CardTitle>
              <CardAction>
                <Badge variant="outline" className="tabular-nums">
                  <TrendIcon />
                  {card.change}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="flex items-start gap-2 font-medium">
                <span className="line-clamp-2 min-w-0 break-words hyphens-auto">{card.trend}</span>
                <TrendIcon className="mt-0.5 size-4 shrink-0" />
              </div>
              <div className="text-muted-foreground break-words hyphens-auto">{card.caption}</div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
