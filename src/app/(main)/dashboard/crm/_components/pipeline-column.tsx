import { cn } from "cn";
import { Plus } from "lucide-react";

import type { OpenStage } from "@/data/crm";
import { CardIconButton, toneSolid, toneWash } from "@/ds/components";
import { type OpenDeal, stageLabels, sumValue } from "@/lib/crm";
import { formatCurrency } from "@/lib/utils";

import { DealCard, stageTones } from "../../_components/deal-card";

export function PipelineColumn({ stage, deals }: { stage: OpenStage; deals: OpenDeal[] }) {
  const tone = stageTones[stage];
  const headingId = `stage-${stage}`;

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "ring-border glass-surface flex w-72 shrink-0 snap-start flex-col gap-3 p-2.5 ring-1 lg:w-auto lg:min-w-0",
        toneWash[tone],
      )}
    >
      <header className="flex items-start justify-between gap-2 px-1.5 pt-1">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className={cn("size-2 rounded-full", toneSolid[tone])} />
            <h2 id={headingId} className="text-sm">
              {stageLabels[stage]}
            </h2>
            <span className="bg-foreground/10 text-foreground/70 rounded-full px-1.5 py-0.5 text-[10px] leading-none tabular-nums">
              {deals.length}
            </span>
          </div>
          <span className="text-muted-foreground text-[11px] tabular-nums">
            {formatCurrency(sumValue(deals), { compact: true })}
          </span>
        </div>
        <CardIconButton icon={Plus} label={`Add deal to ${stageLabels[stage]}`} />
      </header>
      <ul className="flex flex-col gap-2.5">
        {deals.map((deal) => (
          <li key={deal.id}>
            <DealCard deal={deal} tone={tone} className="min-h-32" />
          </li>
        ))}
        {deals.length === 0 && (
          <li className="border-border text-muted-foreground rounded-2xl border border-dashed px-3 py-6 text-center text-xs">
            No deals match these filters
          </li>
        )}
      </ul>
    </section>
  );
}
