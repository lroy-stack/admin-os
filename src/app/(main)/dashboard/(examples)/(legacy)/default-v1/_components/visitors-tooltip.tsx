"use client";

import type { ComponentProps } from "react";

import { ChartTooltipContent } from "@/components/ui/chart";
import { formatNumber, useLocale } from "@/core/i18n/client";

interface VisitorsTooltipProps extends ComponentProps<typeof ChartTooltipContent> {
  /** Series name by data key ("desktop" to "Desktop"), in the active language. */
  readonly seriesLabels: Readonly<Record<string, string>>;
}

/**
 * Chart tooltip whose rows show visitor counts in the active locale (the stock tooltip prints
 * `toLocaleString()` with the runtime's locale) and series names from the dictionary.
 */
export function VisitorsTooltip({ seriesLabels, ...props }: VisitorsTooltipProps) {
  const locale = useLocale();
  return (
    <ChartTooltipContent
      {...props}
      formatter={(value, name, item) => (
        <>
          <div className="size-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color }} />
          <div className="flex flex-1 items-center justify-between gap-2 leading-none">
            <span className="text-muted-foreground">{seriesLabels[String(name)] ?? String(name)}</span>
            <span className="text-foreground font-mono font-medium tabular-nums">
              {formatNumber(Number(value), locale)}
            </span>
          </div>
        </>
      )}
    />
  );
}
