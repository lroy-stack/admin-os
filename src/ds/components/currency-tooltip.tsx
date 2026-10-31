"use client";

import type { ComponentProps } from "react";

import { ChartTooltipContent } from "@/components/ui/chart";
import { formatCurrency } from "@/lib/utils";

/** Chart tooltip whose rows show whole-dollar amounts. */
export function CurrencyTooltipContent(props: ComponentProps<typeof ChartTooltipContent>) {
  return (
    <ChartTooltipContent
      {...props}
      className="w-44"
      formatter={(value, name, item) => (
        <>
          <div className="size-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color }} />
          <div className="flex flex-1 items-center justify-between gap-2 leading-none">
            <span className="text-muted-foreground">{String(name ?? "")}</span>
            <span className="text-foreground font-mono font-medium tabular-nums">
              {formatCurrency(Number(value), { noDecimals: true })}
            </span>
          </div>
        </>
      )}
    />
  );
}
