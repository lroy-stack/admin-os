"use client";

import { cn } from "cn";
import { Ellipsis } from "lucide-react";

import { Card } from "@/components/ui/card";
import {
  format,
  formatAmount,
  formatCalendarDate,
  formatPercent,
  useCurrency,
  useLocale,
  useMessages,
} from "@/core/i18n/client";
import { stageProbability } from "@/data/crm";
import { CardIconButton, type Tone, toneTint } from "@/ds/components";
import { getCustomer, type OpenDeal } from "@/lib/crm";

import { MemberAvatars } from "./member-avatars";
import { dashboardMessageKey } from "./messages";

/**
 * Deal tile shared by the Pipeline board and the Overview hot deals panel. `deal.title` is demo content: the caller
 * localizes it (`localizeDeals`), the card does not.
 */
export function DealCard({
  deal,
  tone,
  showProbability = false,
  className,
}: {
  deal: OpenDeal;
  tone: Tone;
  showProbability?: boolean;
  className?: string;
}) {
  const text = useMessages(dashboardMessageKey);
  const locale = useLocale();
  const currency = useCurrency();
  const customer = getCustomer(deal.customerId);

  return (
    // A neutral deal keeps the Card's own glass surface; the other tones tint it.
    <Card size="sm" className={cn("ring-foreground/15 gap-0 px-3.5", tone !== "neutral" && toneTint[tone], className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-foreground/85 text-[11px]">
          {format(text.deal.closes, locale, {
            date: formatCalendarDate(deal.closeDate, locale, { month: "short", day: "numeric" }),
          })}
        </span>
        <CardIconButton
          icon={Ellipsis}
          label={format(text.deal.moreActions, locale, { title: deal.title })}
          className="ring-foreground/25 size-7"
        />
      </div>
      <h3 className="mt-1.5 text-[15px] leading-snug font-medium">{deal.title}</h3>
      <p className="text-foreground/80 mt-0.5 truncate text-[11px]">{customer.company}</p>
      <div className="mt-auto flex items-end justify-between gap-2 pt-5">
        <div className="flex flex-col gap-0.5">
          <span className="text-base leading-none font-medium tabular-nums">
            {formatAmount(deal.value, currency, locale, { fractionDigits: 0 })}
          </span>
          {showProbability && (
            <span className="text-foreground/80 text-[10px]">
              {format(text.deal.stageProbability, locale, {
                stage: text.stages[deal.stage],
                probability: formatPercent(stageProbability[deal.stage], locale),
              })}
            </span>
          )}
        </div>
        <MemberAvatars ids={deal.ownerIds} />
      </div>
    </Card>
  );
}
