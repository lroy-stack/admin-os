"use client";

import { Copy, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { format, formatAmount, formatDateTime, useCurrency, useLocale, useMessages } from "@/core/i18n/client";
import { ResponsivePanel, type ReturnFocus } from "@/ds/overlays";

import { ecommerceMessageKey } from "./messages";
import { customerEmail } from "./order-view";
import type { OrderRow } from "./recent-orders-table/schema";

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="text-right text-sm font-medium">{children}</dd>
    </div>
  );
}

export interface OrderPanelProps {
  order: OrderRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocus: ReturnFocus;
  onCopyId: (order: OrderRow) => void;
}

/** Look at an order and act on it (ADR 0015): its details, a contact link and Copy order ID. */
export function OrderPanel({ order, open, onOpenChange, returnFocus, onCopyId }: OrderPanelProps) {
  const text = useMessages(ecommerceMessageKey);
  const locale = useLocale();
  const currency = useCurrency();
  const labels = text.orders;
  const when = formatDateTime(new Date(`${order.date}Z`), locale, "UTC");

  return (
    <ResponsivePanel
      open={open}
      onOpenChange={onOpenChange}
      returnFocus={returnFocus}
      title={format(labels.panel.title, locale, { id: order.id })}
      description={format(labels.panel.description, locale, { customer: order.customer, date: when })}
      headerClassName="text-left"
    >
      <dl className="divide-border divide-y px-4">
        <Detail label={labels.columns.customer}>{order.customer}</Detail>
        <Detail label={labels.panel.channel}>{text.filters.channel[order.channel]}</Detail>
        <Detail label={labels.paymentLabel}>{labels.payment[order.payment]}</Detail>
        <Detail label={labels.fulfillmentLabel}>{labels.fulfillment[order.fulfillment]}</Detail>
        <Detail label={labels.itemsLabel}>{format(labels.items, locale, { count: order.itemCount })}</Detail>
        <Detail label={labels.columns.total}>
          <span className="tabular-nums">{formatAmount(order.total, currency, locale, { fractionDigits: 2 })}</span>
        </Detail>
      </dl>
      <div className="mt-auto flex flex-col gap-2 p-4">
        <Button variant="outline" asChild>
          <a href={`mailto:${customerEmail(order.customer)}`}>
            <Mail data-icon="inline-start" />
            {labels.menu.contact}
          </a>
        </Button>
        <Button type="button" variant="outline" onClick={() => onCopyId(order)}>
          <Copy data-icon="inline-start" />
          {labels.menu.copyId}
        </Button>
      </div>
    </ResponsivePanel>
  );
}
