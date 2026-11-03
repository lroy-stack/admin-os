"use client";

import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { TonePill } from "@/ds/components";
import { ResponsivePanel, type ReturnFocus } from "@/ds/overlays";
import { getCustomer, type OpenDeal, weightedValue } from "@/lib/crm";

import { resolveDeal } from "./deal-state";
import { useDealsState } from "./deals-session";
import { MemberAvatars } from "./member-avatars";
import { dashboardMessageKey } from "./messages";
import { stageTones } from "./stage-tones";

export interface DealPanelProps {
  deal: OpenDeal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocus: ReturnFocus;
  onEdit: () => void;
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  );
}

/** The deal's details with Edit (ADR 0015: look at a record and act on it). Shows the session's edits live. */
export function DealPanel({ deal: opened, open, onOpenChange, returnFocus, onEdit }: DealPanelProps) {
  const text = useMessages(dashboardMessageKey);
  const locale = useLocale();
  const currency = useCurrency();
  const state = useDealsState();
  const deal = resolveDeal(opened, state) ?? opened;
  const customer = getCustomer(deal.customerId);
  const whole = { fractionDigits: 0 };

  return (
    <ResponsivePanel
      open={open}
      onOpenChange={onOpenChange}
      returnFocus={returnFocus}
      title={deal.title}
      description={format(text.deal.panel.description, locale, { company: customer.company })}
      headerClassName="text-left"
    >
      <dl className="divide-border divide-y px-4">
        <Detail label={text.deal.panel.customer}>
          {customer.name}
          <span className="text-muted-foreground block text-xs font-normal">{customer.title}</span>
        </Detail>
        <Detail label={text.deal.panel.stage}>
          <TonePill tone={stageTones[deal.stage]}>
            {format(text.deal.stageProbability, locale, {
              stage: text.stages[deal.stage],
              probability: formatPercent(stageProbability[deal.stage], locale),
            })}
          </TonePill>
        </Detail>
        <Detail label={text.deal.panel.closes}>
          {formatCalendarDate(deal.closeDate, locale, { year: "numeric", month: "short", day: "numeric" })}
        </Detail>
        <Detail label={text.deal.panel.value}>
          <span className="tabular-nums">{formatAmount(deal.value, currency, locale, whole)}</span>
        </Detail>
        <Detail label={text.deal.panel.weighted}>
          <span className="tabular-nums">{formatAmount(weightedValue(deal), currency, locale, whole)}</span>
        </Detail>
        <Detail label={text.deal.panel.owners}>
          <MemberAvatars ids={deal.ownerIds} />
        </Detail>
      </dl>
      <div className="mt-auto p-4">
        <Button type="button" variant="outline" className="w-full" onClick={onEdit}>
          <Pencil data-icon="inline-start" />
          {text.deal.panel.edit}
        </Button>
      </div>
    </ResponsivePanel>
  );
}
