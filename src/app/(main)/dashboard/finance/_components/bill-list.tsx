"use client";

import { useId, useState } from "react";

import { ChevronRight } from "lucide-react";
import type { SimpleIcon as SimpleIconData } from "simple-icons";

import { SimpleIcon } from "@/components/simple-icon";
import { Button } from "@/components/ui/button";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Switch } from "@/components/ui/switch";
import { format, useLocale, useMessages } from "@/core/i18n/client";
import { QuickDialog } from "@/ds/overlays";

import { useOpenWindow } from "../../_components/use-open-window";
import { financeMessageKey } from "./messages";

export interface Bill {
  readonly id: string;
  readonly title: string;
  /** The due time and date, already formatted. */
  readonly when: string;
  readonly amount: string;
  readonly due: string;
  readonly icon: SimpleIconData;
  readonly autopay: boolean;
}

/** The upcoming bills. Each opens a `QuickDialog` with its amount, due date and an autopay switch (demo-local). */
export function BillList({ bills }: { bills: readonly Bill[] }) {
  const text = useMessages(financeMessageKey);
  const locale = useLocale();
  const window = useOpenWindow<string>();
  const switchId = useId();
  const [autopay, setAutopay] = useState<Readonly<Record<string, boolean>>>(() =>
    Object.fromEntries(bills.map((bill) => [bill.id, bill.autopay])),
  );
  const open = bills.find((bill) => bill.id === window.shown?.value);

  return (
    <>
      <ItemGroup>
        {bills.map((bill) => (
          <Item key={bill.id} variant="outline" size="xs">
            <ItemMedia>
              <div className="bg-background grid size-9 place-items-center rounded-md border">
                <SimpleIcon icon={bill.icon} />
              </div>
            </ItemMedia>
            <ItemContent className="min-w-0">
              <ItemTitle className="line-clamp-2 block w-full break-words hyphens-auto" title={bill.title}>
                {bill.title}
              </ItemTitle>
              <ItemDescription>{bill.when}</ItemDescription>
            </ItemContent>
            <ItemActions className="shrink-0">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={format(text.bill.open, locale, { title: bill.title })}
                onClick={(event) => window.show(bill.id, event.currentTarget)}
              >
                <ChevronRight className="text-muted-foreground size-5" />
              </Button>
            </ItemActions>
          </Item>
        ))}
      </ItemGroup>
      {window.shown && open ? (
        <QuickDialog
          demo
          key={window.shown.opening}
          open={window.shown.open}
          onOpenChange={window.onOpenChange}
          title={open.title}
          returnFocus={window.returnFocus}
          footer={({ close }) => (
            <Button type="button" onClick={close}>
              {text.done}
            </Button>
          )}
        >
          <dl className="divide-y rounded-lg border text-sm">
            <div className="flex items-center justify-between gap-4 px-3 py-2">
              <dt className="text-muted-foreground">{text.bill.amount}</dt>
              <dd className="font-medium tabular-nums">{open.amount}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-3 py-2">
              <dt className="text-muted-foreground">{text.bill.due}</dt>
              <dd className="font-medium">{open.due}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-3 py-2">
              <dt>
                <label htmlFor={switchId} className="text-muted-foreground">
                  {text.bill.autopay}
                </label>
              </dt>
              <dd>
                <Switch
                  id={switchId}
                  checked={autopay[open.id] ?? false}
                  onCheckedChange={(checked) => setAutopay({ ...autopay, [open.id]: checked })}
                />
              </dd>
            </div>
          </dl>
        </QuickDialog>
      ) : null}
    </>
  );
}
