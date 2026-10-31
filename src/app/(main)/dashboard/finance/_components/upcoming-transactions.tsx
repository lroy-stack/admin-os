import { ChevronRight, Zap } from "lucide-react";
import { siClaude, siLinear, siResend } from "simple-icons";

import { SimpleIcon } from "@/components/simple-icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { getCurrency, getLocale, getMessages } from "@/config/locale.server";
import { format, formatAmount, formatCalendarDate, formatTime } from "@/core/i18n/client";

import { financeMessages } from "./messages.server";

const DAY_MS = 24 * 60 * 60 * 1000;

const upcoming = [
  { id: "claude", inDays: 2, hour: 14, minute: 45, icon: siClaude },
  { id: "resend", inDays: 4, hour: 7, minute: 0, icon: siResend },
  { id: "linear", inDays: 10, hour: 7, minute: 0, icon: siLinear },
] as const;

export async function UpcomingTransactions() {
  const [text, locale, currency] = await Promise.all([getMessages(financeMessages), getLocale(), getCurrency()]);
  const labels = text.upcoming;
  const today = Date.now();
  const transactions = upcoming.map((entry) => {
    const day = new Date(today + entry.inDays * DAY_MS);
    return {
      id: entry.id,
      icon: entry.icon,
      title: labels.items[entry.id],
      when: format(labels.when, locale, {
        time: formatTime(Date.UTC(2026, 0, 5, entry.hour, entry.minute), locale, "UTC"),
        date: formatCalendarDate(day.toISOString().slice(0, 10), locale, { dateStyle: "long" }),
      }),
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">{labels.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-3xl leading-none font-normal tracking-tight tabular-nums">
              {formatAmount(1245, currency, locale, { fractionDigits: 0 })}
            </h2>
            <p className="text-muted-foreground text-sm leading-snug">
              {format(labels.billsDue, locale, { count: transactions.length })}
            </p>
          </div>
          <div className="border-border bg-muted/70 flex max-w-full items-center gap-2 rounded-md border px-2 py-1.5 text-sm">
            <Zap className="fill-primary text-primary size-4 shrink-0" />
            <span className="text-muted-foreground min-w-0 break-words">
              {format(labels.autopay, locale, { amount: formatAmount(145, currency, locale) })}
            </span>
          </div>
        </div>

        <ItemGroup>
          {transactions.map((transaction) => (
            <Item key={transaction.id} variant="outline" size="xs">
              <ItemMedia>
                <div className="bg-background grid size-9 place-items-center rounded-md border">
                  <SimpleIcon icon={transaction.icon} />
                </div>
              </ItemMedia>
              <ItemContent className="min-w-0">
                <ItemTitle className="line-clamp-2 block w-full break-words hyphens-auto" title={transaction.title}>
                  {transaction.title}
                </ItemTitle>
                <ItemDescription>{transaction.when}</ItemDescription>
              </ItemContent>
              <ItemActions className="shrink-0">
                <ChevronRight className="text-muted-foreground size-5" />
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}
