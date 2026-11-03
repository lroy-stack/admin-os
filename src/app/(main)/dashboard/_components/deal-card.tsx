"use client";

import { cn } from "cn";

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
import { type Tone, toneTint } from "@/ds/components";
import { getCustomer, type OpenDeal } from "@/lib/crm";

import { DealMenu } from "./deal-menu";
import { resolveDeal } from "./deal-state";
import { useDealWindows } from "./deal-windows";
import { useDealsState } from "./deals-session";
import { MemberAvatars } from "./member-avatars";
import { dashboardMessageKey } from "./messages";

/**
 * Deal tile shared by the Pipeline board and the Overview hot deals panel. `deal.title` is demo content: the caller
 * localizes it (`localizeDeals`), the card does not. The card shows the session's edits (`deals-session.ts`), opens the
 * deal panel and carries the deal's menu; it needs a `DealWindowsProvider` above it.
 */
export function DealCard({
  deal: given,
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
  const windows = useDealWindows();
  const state = useDealsState();
  const deal = resolveDeal(given, state);
  // Deleted or closed in this session: the card is gone and focus went to the screen's region.
  if (!deal) return null;
  const customer = getCustomer(deal.customerId);

  return (
    // A neutral deal keeps the Card's own glass surface; the other tones tint it.
    <Card
      size="sm"
      className={cn("ring-foreground/15 relative gap-0 px-3.5", tone !== "neutral" && toneTint[tone], className)}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-foreground/85 text-[11px]">
          {format(text.deal.closes, locale, {
            date: formatCalendarDate(deal.closeDate, locale, { month: "short", day: "numeric" }),
          })}
        </span>
        <DealMenu deal={deal} className="ring-foreground/25 relative z-10 size-7" />
      </div>
      <h3 className="mt-1.5 text-[15px] leading-snug font-medium">
        {/* The whole card is the target: the button's pseudo-element covers it and the menu sits above it. */}
        <button
          type="button"
          className="focus-visible:ring-ring/60 rounded-sm text-left outline-none after:absolute after:inset-0 after:content-[''] focus-visible:ring-2"
          onClick={(event) => windows.openPanel(deal, event.currentTarget)}
        >
          {deal.title}
        </button>
      </h3>
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
