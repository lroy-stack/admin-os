import { Ellipsis } from "lucide-react";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardIconButton } from "@/ds/components";
import { formatCurrency } from "@/lib/utils";

// Semicircle from left to right; pathLength lets the dash array read as a percentage.
const ARC_PATH = "M 12 64 A 52 52 0 0 1 116 64";

export function TeamQuota({ won, target, attainment }: { won: number; target: number; attainment: number }) {
  const percent = Math.min(100, Math.round(attainment * 100));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-normal">Team quota</CardTitle>
        <CardAction>
          <CardIconButton icon={Ellipsis} label="Quota options" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col items-center justify-end gap-2">
        <div className="relative w-full max-w-48">
          <meter className="sr-only" min={0} max={100} value={percent} aria-label="Team quota attainment">
            {percent}%
          </meter>
          <svg viewBox="0 0 128 72" className="w-full" aria-hidden="true">
            <path
              d={ARC_PATH}
              fill="none"
              stroke="currentColor"
              strokeWidth={12}
              strokeLinecap="round"
              className="text-foreground/10"
            />
            <path
              d={ARC_PATH}
              fill="none"
              stroke="currentColor"
              strokeWidth={12}
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={`${percent} 100`}
              className="text-brand"
            />
          </svg>
          <span className="absolute inset-x-0 bottom-0 text-center text-2xl font-medium tabular-nums">{percent}%</span>
        </div>
        <p className="text-muted-foreground text-center text-xs">
          {formatCurrency(won, { compact: true })} of {formatCurrency(target, { compact: true })} · 12-month quota
        </p>
      </CardContent>
    </Card>
  );
}
