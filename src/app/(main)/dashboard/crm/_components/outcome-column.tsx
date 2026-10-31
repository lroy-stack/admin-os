import { cn } from "cn";
import { CircleOff, Trophy } from "lucide-react";

import { format, formatAmount, useCurrency, useLocale, useMessages } from "@/core/i18n/client";

import { crmMessageKey } from "./messages";

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
  const text = useMessages(crmMessageKey).outcomes;
  const locale = useLocale();
  const currency = useCurrency();

  return (
    <aside aria-label={text.label} className="flex w-28 shrink-0 snap-start flex-col gap-2.5 self-start lg:w-24">
      <OutcomeTile
        title={text.won}
        detail={format(text.wonDetail, locale, { count: won.count })}
        value={formatAmount(won.value, currency, locale, { compact: true })}
        icon={Trophy}
        highlighted
      />
      <OutcomeTile
        title={text.lost}
        detail={format(text.lostDetail, locale, { count: lost.count })}
        icon={CircleOff}
        highlighted={false}
      />
    </aside>
  );
}
