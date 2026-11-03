"use client";

import { useMessages } from "@/core/i18n/client";
import type { OpenDeal } from "@/lib/crm";

import { DealCard } from "../../_components/deal-card";
import { resolveDeal } from "../../_components/deal-state";
import { DealWindowsProvider } from "../../_components/deal-windows";
import { useDealsState } from "../../_components/deals-session";
import { overviewMessageKey } from "./messages";

function Grid({ deals }: { deals: OpenDeal[] }) {
  const text = useMessages(overviewMessageKey).hotDeals;
  const state = useDealsState();
  const anyLeft = deals.some((deal) => resolveDeal(deal, state) !== null);

  return (
    <div
      data-deal-region
      tabIndex={-1}
      className="grid flex-1 auto-rows-fr grid-cols-1 gap-2.5 outline-none sm:grid-cols-2"
    >
      {deals.map((deal) => (
        <DealCard key={deal.id} deal={deal} tone="neutral" showProbability className="min-h-36" />
      ))}
      {anyLeft ? null : (
        <p className="text-muted-foreground border-border col-span-full rounded-2xl border border-dashed px-3 py-6 text-center text-xs">
          {text.empty}
        </p>
      )}
    </div>
  );
}

/** The hot deal cards on the session's deals: the same menu, panel and edits as the Pipeline's. */
export function HotDealsGrid({ deals }: { deals: OpenDeal[] }) {
  return (
    <DealWindowsProvider>
      <Grid deals={deals} />
    </DealWindowsProvider>
  );
}
