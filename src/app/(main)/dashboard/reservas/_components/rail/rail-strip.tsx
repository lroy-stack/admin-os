import { cn } from "cn";
import { PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { formatClock } from "../reservation-status";
import type { RailPlan } from "./rail-plan";

/** The rail folded to a slim strip: now and the upcoming slots with their arrival counts. */
export function RailStrip({ plan, onExpand }: { plan: RailPlan; onExpand: () => void }) {
  const upcoming = plan.slots.filter((slot) => slot.isNow || slot.arrivals > 0);

  return (
    <div className="flex h-full w-full flex-col items-center gap-1 py-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Show arrivals"
            className="size-8 rounded-full"
            onClick={onExpand}
          >
            <PanelLeftOpen />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Show arrivals</TooltipContent>
      </Tooltip>
      <ScrollArea className="min-h-0 w-full flex-1">
        <ul className="flex flex-col items-center gap-0.5 pb-2">
          {upcoming.map((slot) => (
            <li key={slot.startMin} className="w-full px-1">
              <button
                type="button"
                onClick={onExpand}
                aria-label={`${formatClock(slot.startMin)}, ${slot.arrivals} arrivals`}
                className={cn(
                  "flex w-full flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] text-muted-foreground outline-none hover:bg-foreground/8 focus-visible:ring-2 focus-visible:ring-ring",
                  slot.isNow && "bg-brand/15 text-foreground",
                )}
              >
                <span className="tabular-nums">{formatClock(slot.startMin)}</span>
                <span
                  className={cn(
                    "grid size-5 place-items-center rounded-full bg-foreground/10 text-[10px] text-foreground tabular-nums",
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
