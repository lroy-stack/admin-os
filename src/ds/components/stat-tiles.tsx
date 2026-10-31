import type { ReactNode } from "react";

import { cn } from "cn";

export type StatTile = { label: string; value: ReactNode };

/** Inset panel of small label/value pairs (customer card, reservation sheet). */
export function StatTiles({ items, className }: { items: readonly StatTile[]; className?: string }) {
  return (
    <dl className={cn("bg-foreground/5 ring-border grid grid-cols-2 gap-3 rounded-2xl px-3 py-2.5 ring-1", className)}>
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-0.5">
          <dt className="text-muted-foreground text-[10px]">{item.label}</dt>
          <dd className="text-sm tabular-nums">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
