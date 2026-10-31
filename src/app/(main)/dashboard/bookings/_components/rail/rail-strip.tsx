"use client";

import { cn } from "cn";
import { PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { format, useLocale, useMessages } from "@/core/i18n/client";

import { bookingsMessageKey } from "../messages";
import { formatClock } from "../reservation-status";
import type { RailPlan } from "./rail-plan";

/** The rail folded to a slim strip: now and the upcoming slots with their arrival counts. */
export function RailStrip({ plan, onExpand }: { plan: RailPlan; onExpand: () => void }) {
  const text = useMessages(bookingsMessageKey);
  const locale = useLocale();
  const upcoming = plan.slots.filter((slot) => slot.isNow || slot.arrivals > 0);

  return (
    <div className="flex h-full w-full flex-col items-center gap-1 py-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={text.rail.show}
            className="size-8 rounded-full"
            onClick={onExpand}
          >
            <PanelLeftOpen />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">{text.rail.show}</TooltipContent>
      </Tooltip>
      <ScrollArea className="min-h-0 w-full flex-1">
        <ul className="flex flex-col items-center gap-0.5 pb-2">
          {upcoming.map((slot) => (
            <li key={slot.startMin} className="w-full px-1">
              <button
                type="button"
                onClick={onExpand}
                aria-label={format(text.rail.slotLabel, locale, {
                  time: formatClock(slot.startMin, locale),
                  arrivals: format(text.rail.arrivals, locale, { count: slot.arrivals }),
                })}
                className={cn(
                  "text-muted-foreground hover:bg-foreground/8 focus-visible:ring-ring flex w-full flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] outline-none focus-visible:ring-2",
                  slot.isNow && "bg-brand/15 text-foreground",
                )}
              >
                <span className="tabular-nums">{formatClock(slot.startMin, locale)}</span>
                <span
                  className={cn(
                    "bg-foreground/10 text-foreground grid size-5 place-items-center rounded-full text-[10px] tabular-nums",
                    slot.isNow && "bg-brand text-brand-foreground",
                  )}
                >
                  {slot.arrivals}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}
