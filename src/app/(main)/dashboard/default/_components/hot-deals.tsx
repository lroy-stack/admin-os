import { ArrowUpRight, Plus } from "lucide-react";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMessages } from "@/config/locale.server";
import { CardIconButton } from "@/ds/components";
import type { OpenDeal } from "@/lib/crm";

import { DealCard } from "../../_components/deal-card";
import { overviewMessages } from "./messages.server";

/** `deals` arrive with their titles already in the request's locale (`localizeDeals`). */
export async function HotDeals({ deals }: { deals: OpenDeal[] }) {
  const text = (await getMessages(overviewMessages)).hotDeals;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-normal">{text.title}</CardTitle>
        <CardAction className="flex items-center gap-1.5">
          <span className="text-muted-foreground mr-1 text-[11px]">{text.byWeightedValue}</span>
          <CardIconButton icon={Plus} label={text.addDeal} href="/dashboard/crm" />
          <CardIconButton icon={ArrowUpRight} label={text.openPipeline} href="/dashboard/crm" />
        </CardAction>
      </CardHeader>
      <CardContent className="grid flex-1 auto-rows-fr grid-cols-1 gap-2.5 sm:grid-cols-2">
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} tone="neutral" showProbability className="min-h-36" />
        ))}
      </CardContent>
    </Card>
  );
}
