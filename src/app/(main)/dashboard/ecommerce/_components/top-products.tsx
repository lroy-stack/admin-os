import { ArrowUpRight } from "lucide-react";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getCurrency, getLocale } from "@/config/locale.server";
import { format, formatAmount, formatPercent } from "@/core/i18n/client";

import { ecommerceMessages } from "./messages.server";

/** Demo catalogue: amounts are in the business currency, shares are fractions, names are dictionary keys. */
const categories = [
  { id: "apparel", share: 0.44, color: "var(--chart-3)" },
  { id: "accessories", share: 0.32, color: "var(--chart-2)" },
  { id: "home", share: 0.24, color: "var(--chart-1)" },
] as const;

const products = [
  { id: "linenOvershirt", category: "apparel", share: 0.31, sales: 14_820 },
  { id: "everydayTote", category: "accessories", share: 0.24, sales: 11_460 },
  { id: "ceramicPlanter", category: "home", share: 0.18, sales: 8930 },
] as const;

const topShare = 0.73;

export async function TopProducts() {
  const [locale, currency] = await Promise.all([getLocale(), getCurrency()]);
  const text = ecommerceMessages[locale].topProducts;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-muted-foreground text-sm font-normal">{text.title}</CardTitle>
        <CardDescription className="text-foreground text-xl leading-none tracking-tight tabular-nums">
          {format(text.ofSales, locale, { percent: formatPercent(topShare, locale) })}
        </CardDescription>
        <CardAction>
          <ArrowUpRight className="size-4" />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div aria-label={text.chartLabel} className="bg-muted flex h-2 gap-1 overflow-hidden" role="img">
            {categories.map((category) => (
              <div
                aria-hidden="true"
                key={category.id}
                className="rounded-md"
                style={{
                  backgroundColor: category.color,
                  width: `${category.share * 100}%`,
                }}
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {categories.map((category) => (
              <div className="flex min-w-0 items-center gap-1" key={category.id}>
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-muted-foreground text-xs break-words">{text.categories[category.id]}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-4 gap-y-3">
          <div className="text-muted-foreground text-xs">{text.products}</div>
          <div className="text-muted-foreground text-xs">{text.share}</div>
          <div className="text-muted-foreground text-right text-xs">{text.sales}</div>

          {products.map((product) => (
            <div className="contents text-sm" key={product.id}>
              <div className="min-w-0">
                <div className="line-clamp-2 block w-full font-medium break-words hyphens-auto">
                  {text.items[product.id]}
                </div>
                <div className="text-muted-foreground text-xs break-words">{text.categories[product.category]}</div>
              </div>
              <div className="text-muted-foreground shrink-0 self-center tabular-nums">
                {formatPercent(product.share, locale)}
              </div>
              <div className="shrink-0 self-center text-right font-medium tabular-nums">
                {formatAmount(product.sales, currency, locale, { fractionDigits: 0 })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
