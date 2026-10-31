import { cn } from "cn";
import { Ellipsis } from "lucide-react";

import { Card } from "@/components/ui/card";
import { type OpenStage, stageProbability } from "@/data/crm";
import { CardIconButton, type Tone, toneTint } from "@/ds/components";
import { formatShortDate, getCustomer, type OpenDeal, stageLabels } from "@/lib/crm";
import { formatCurrency } from "@/lib/utils";

import { MemberAvatars } from "./member-avatars";

/** Pipeline stages read left to right as azure → accent → salmon → neutral. */
export const stageTones: Record<OpenStage, Tone> = {
  qualification: "azure",
  proposal: "brand",
  negotiation: "salmon",
  closing: "neutral",
};

/** Deal tile shared by the Pipeline board and the Overview hot deals panel. */
export function DealCard({
  deal,
  tone,
  showProbability = false,
  className,
}: {
  deal: OpenDeal;
  tone: Tone;
  showProbability?: boolean;
  className?: string;
}) {
  const customer = getCustomer(deal.customerId);

  return (
    // A neutral deal keeps the Card's own glass surface; the other tones tint it.
    <Card size="sm" className={cn("ring-foreground/15 gap-0 px-3.5", tone !== "neutral" && toneTint[tone], className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-foreground/85 text-[11px]">Closes {formatShortDate(deal.closeDate)}</span>
        <CardIconButton
          icon={Ellipsis}
          label={`More actions for ${deal.title}`}
          className="ring-foreground/25 size-7"
        />
      </div>
      <h3 className="mt-1.5 text-[15px] leading-snug font-medium">{deal.title}</h3>
      <p className="text-foreground/80 mt-0.5 truncate text-[11px]">{customer.company}</p>
      <div className="mt-auto flex items-end justify-between gap-2 pt-5">
        <div className="flex flex-col gap-0.5">
          <span className="text-base leading-none font-medium tabular-nums">
            {formatCurrency(deal.value, { noDecimals: true })}
          </span>
          {showProbability && (
            <span className="text-foreground/80 text-[10px]">
              {stageLabels[deal.stage]} · {Math.round(stageProbability[deal.stage] * 100)}%
            </span>
          )}
        </div>
        <MemberAvatars ids={deal.ownerIds} />
      </div>
    </Card>
  );
}
