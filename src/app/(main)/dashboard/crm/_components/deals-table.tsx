import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { stageProbability } from "@/data/crm";
import { TonePill } from "@/ds/components";
import { formatShortDate, getCustomer, type OpenDeal, stageLabels } from "@/lib/crm";
import { formatCurrency } from "@/lib/utils";

import { MemberAvatars } from "../../_components/member-avatars";
import { stageTones } from "../../_components/stage-tones";

export function DealsTable({ deals }: { deals: OpenDeal[] }) {
  return (
    <div className="bg-card ring-border glass-surface px-3 py-2 ring-1">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-muted-foreground text-xs font-normal">Deal</TableHead>
            <TableHead className="text-muted-foreground text-xs font-normal">Stage</TableHead>
            <TableHead className="text-muted-foreground text-xs font-normal">Closes</TableHead>
            <TableHead className="text-muted-foreground text-xs font-normal">Owners</TableHead>
            <TableHead className="text-muted-foreground text-right text-xs font-normal">Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.map((deal) => (
            <TableRow key={deal.id} className="hover:bg-foreground/5">
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{deal.title}</span>
                  <span className="text-muted-foreground text-xs">{getCustomer(deal.customerId).company}</span>
                </div>
              </TableCell>
              <TableCell>
                <TonePill tone={stageTones[deal.stage]}>
                  {stageLabels[deal.stage]} · {Math.round(stageProbability[deal.stage] * 100)}%
                </TonePill>
              </TableCell>
              <TableCell className="text-muted-foreground">{formatShortDate(deal.closeDate)}</TableCell>
              <TableCell>
                <MemberAvatars ids={deal.ownerIds} />
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatCurrency(deal.value, { noDecimals: true })}
              </TableCell>
            </TableRow>
          ))}
          {deals.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground py-10 text-center">
                No deals match these filters
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
