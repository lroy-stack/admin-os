"use client";

import type { ComponentProps } from "react";

import { ChartTooltipContent } from "@/components/ui/chart";
import { useChartFormatters } from "@/core/i18n/client";

/**
 * Chart tooltip whose rows show whole-unit amounts in the active locale. Amounts are in the business currency
 * (`useCurrency`), so a chart of plain numbers needs no props.
 */
export function CurrencyTooltipContent(props: ComponentProps<typeof ChartTooltipContent>) {
  const { currency } = useChartFormatters();
  return (
    <ChartTooltipContent
      {...props}
      className="w-44"
      formatter={(value, name, item) => (
        <>
          <div className="size-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color }} />
          <div className="flex flex-1 items-center justify-between gap-2 leading-none">
            <span className="text-muted-foreground">{String(name ?? "")}</span>
            <span className="text-foreground font-mono font-medium tabular-nums">{currency(Number(value))}</span>
          </div>
        </>
      )}
    />
  );
}
