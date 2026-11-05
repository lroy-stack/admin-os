import type { ReactNode } from "react";

import { cn } from "cn";

export interface Fact {
  readonly label: string;
  readonly value: ReactNode;
}

/** Label and value pairs as a definition list; long values wrap instead of widening the page. */
export function FactList({ facts, className }: { facts: readonly Fact[]; className?: string }) {
  return (
    <dl className={cn("grid gap-x-6 gap-y-4", className)}>
      {facts.map((fact) => (
        <div key={fact.label} className="flex min-w-0 flex-col gap-0.5">
          <dt className="text-muted-foreground text-xs">{fact.label}</dt>
          <dd className="text-sm break-words">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}
