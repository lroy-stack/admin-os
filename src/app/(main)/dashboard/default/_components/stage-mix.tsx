import { cn } from "cn";
import { ArrowUpRight } from "lucide-react";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OpenStage } from "@/data/crm";
import { CardIconButton, toneSolid } from "@/ds/components";
import { stageLabels } from "@/lib/crm";
import { formatCurrency } from "@/lib/utils";

import { stageTones } from "../../_components/deal-card";

export function StageMix({ stages }: { stages: { stage: OpenStage; count: number; value: number }[] }) {
  const total = stages.reduce((sum, item) => sum + item.value, 0);
  const count = stages.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-normal">Stage mix</CardTitle>
        <CardAction>
          <CardIconButton icon={ArrowUpRight} label="Open pipeline" href="/dashboard/crm" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-2xl font-medium tracking-tight tabular-nums">
            {formatCurrency(total, { noDecimals: true })}
          </span>
          <span className="text-muted-foreground text-xs">open across {count} deals</span>
        </div>
        <div className="flex h-2.5 gap-1" role="img" aria-label="Open pipeline value by stage">
          {stages.map((item) => (
            <span
              key={item.stage}
              className={cn("rounded-full", toneSolid[stageTones[item.stage]])}
              style={{ flexGrow: item.value }}
            />
          ))}
        </div>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          {stages.map((item) => (
            <li key={item.stage} className="flex items-center gap-2">
              <span className={cn("size-2 shrink-0 rounded-full", toneSolid[stageTones[item.stage]])} />
              <span className="text-muted-foreground">{stageLabels[item.stage]}</span>
              <span className="ml-auto tabular-nums">{formatCurrency(item.value, { compact: true })}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
