import { Home, Receipt, Sparkles, Zap } from "lucide-react";
import { siApple, siMastercard } from "simple-icons";

import { SimpleIcon } from "@/components/simple-icon";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getCurrency, getLocale, getMessages } from "@/config/locale.server";
import { format, formatAmount, formatCalendarDate } from "@/core/i18n/client";

import { financeV1Messages } from "./messages.server";

const DAY_MS = 24 * 60 * 60 * 1000;

const upcomingPayments = [
  { id: 1, key: "rent", icon: Home, amount: 1200, inDays: 2 },
  { id: 2, key: "electricity", icon: Zap, amount: 75, inDays: 2 },
  { id: 3, key: "chatgpt", icon: Sparkles, amount: 20, inDays: 7 },
  { id: 4, key: "creditCard", icon: Receipt, amount: 420, inDays: 9 },
] as const;

// The cardholder is a person and the number and expiry are data, so none of them is translated.
const CARDHOLDER = "Alex Morgan";
const EXPIRY = "06/30";
const MASKED_NUMBER = "•••• •••• •••• 2301";
const MASKED_CVV = "•••";

export async function CardOverview() {
  const [text, locale, currency] = await Promise.all([getMessages(financeV1Messages), getLocale(), getCurrency()]);
  const labels = text.card;
  const now = Date.now();
  const amount = (value: number, fractionDigits = 0) => formatAmount(value, currency, locale, { fractionDigits });

  return (
    <Card className="shadow-xs">
      <CardHeader className="items-center">
        <CardTitle>{labels.title}</CardTitle>
        <CardDescription>{format(labels.description, locale, { added: 1, total: 4 })}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid w-full place-items-center">
            <div className="bg-primary relative flex aspect-8/5 w-full max-w-100 flex-col justify-between overflow-hidden rounded-xl p-6">
              <div className="flex items-start justify-between">
                <SimpleIcon icon={siApple} className="fill-primary-foreground size-5 sm:size-8" />
              </div>

              <div className="space-y-1">
                <p className="text-primary-foreground/90 font-mono text-sm tracking-[0.15em] sm:text-lg">
                  {MASKED_NUMBER}
                </p>
              </div>

              <div className="flex items-end justify-between">
                <div className="space-y-2">
                  <p className="text-primary-foreground font-mono text-sm font-medium tracking-wide uppercase">
                    {CARDHOLDER}
                  </p>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-primary-foreground/80 text-[10px] tracking-wider uppercase">
                        {labels.validThru}
                      </p>
                      <p className="text-primary-foreground/80 font-mono text-xs">{EXPIRY}</p>
                    </div>
                    <div>
                      <p className="text-primary-foreground/80 text-[10px] tracking-wider uppercase">{labels.cvv}</p>
                      <p className="text-primary-foreground/80 font-mono text-xs">{MASKED_CVV}</p>
                    </div>
                  </div>
                </div>
                <SimpleIcon icon={siMastercard} className="fill-primary-foreground/80 size-7 sm:size-10" />
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">{labels.type}</span>
              <span className="text-right font-medium">{labels.virtual}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">{labels.billingCycle}</span>
              <span className="text-right font-medium">{format(labels.billingDay, locale, { day: 21 })}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">{labels.limit}</span>
              <span className="font-medium tabular-nums">{amount(62000, 2)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">{labels.availableBalance}</span>
              <span className="font-medium tabular-nums">{amount(13100.06, 2)}</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h6 className="text-muted-foreground text-sm uppercase">{labels.upcomingPayments}</h6>

            <div className="space-y-4">
              {upcomingPayments.map((transaction) => (
                <div key={transaction.id} className="flex items-center gap-2">
                  <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-full">
                    <transaction.icon className="text-muted-foreground size-5" />
                  </div>
                  <div className="flex w-full items-end justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium break-words">{labels.payments[transaction.key]}</p>
                      <p className="text-muted-foreground text-xs">
                        {format(labels.dueOn, locale, {
                          date: formatCalendarDate(
                            new Date(now + transaction.inDays * DAY_MS).toISOString().slice(0, 10),
                            locale,
                            {
                              dateStyle: "long",
                            },
                          ),
                        })}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <span className="text-destructive text-sm leading-none font-medium tabular-nums">
                        {amount(transaction.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
