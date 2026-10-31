import { cn } from "cn";
import { CircleOff, Trophy } from "lucide-react";

import { formatCurrency } from "@/lib/utils";

type Outcome = { count: number; value: number };

function OutcomeTile({
  title,
  detail,
  value,
  icon: Icon,
  highlighted,
}: {
  title: string;
  detail: string;
  value?: string;
  icon: typeof Trophy;
  highlighted: boolean;
}) {
  return (
    <div className="bg-card ring-border glass-surface flex min-h-44 flex-col items-center justify-center gap-1.5 px-2 py-5 text-center ring-1">
      <span
        className={cn(
          "mb-1 grid size-10 place-items-center rounded-full",
          highlighted ? "bg-brand text-brand-foreground" : "bg-foreground/10 text-foreground/60",
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="text-sm">{title}</span>
      <span className="text-muted-foreground text-[10px] leading-tight">{detail}</span>
      {value && <span className="text-[11px] font-medium tabular-nums">{value}</span>}
    </div>
  );
}

/** Narrow summary column for deals closed this month. */
export function OutcomeColumn({ won, lost }: { won: Outcome; lost: Outcome }) {
  return (
    <aside aria-label="Closed this month" className="flex w-28 shrink-0 snap-start flex-col gap-2.5 self-start lg:w-24">
      <OutcomeTile
        title="Won"
        detail={`${won.count} this month`}
        value={formatCurrency(won.value, { compact: true })}
        icon={Trophy}
        highlighted
      />
      <OutcomeTile title="Lost" detail={`${lost.count} closed lost`} icon={CircleOff} highlighted={false} />
    </aside>
  );
}
