import type { ReactNode } from "react";

import { cn } from "cn";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export type KpiBadgeTone = "salmon" | "azure" | "neutral";

export type HeaderKpi = {
  icon: LucideIcon;
  value: string;
  label: string;
  badge?: { text: string; tone: KpiBadgeTone };
};

const badgeTones: Record<KpiBadgeTone, string> = {
  salmon: "bg-salmon text-background",
  azure: "bg-azure text-background",
  neutral: "bg-foreground/10 text-foreground/80 ring-1 ring-border",
};

function KpiChip({ kpi }: { kpi: HeaderKpi }) {
  return (
    <div className="flex items-center gap-3">
      <span className="liquid-glass grid size-10 shrink-0 place-items-center rounded-full">
        <kpi.icon className="text-foreground/80 size-4" aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none font-medium tabular-nums">{kpi.value}</span>
          {kpi.badge && (
            <Badge className={cn("h-auto px-1.5 py-0.5 text-[10px] leading-none", badgeTones[kpi.badge.tone])}>
              {kpi.badge.text}
            </Badge>
          )}
        </div>
        <span className="text-muted-foreground max-w-36 text-xs leading-snug">{kpi.label}</span>
      </div>
    </div>
  );
}

/** Large two-line title with KPI chips beside it; `actions` sits on the right edge. */
export function PageHeader({ title, kpis, actions }: { title: string; kpis: HeaderKpi[]; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-10 gap-y-5">
      <h1 className="w-min text-[2rem] leading-[1.05] font-normal tracking-tight">{title}</h1>
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
        {kpis.map((kpi) => (
          <KpiChip key={kpi.label} kpi={kpi} />
        ))}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 lg:ml-auto">{actions}</div>}
    </div>
  );
}
