import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  format,
  formatAmount,
  formatCalendarDate,
  formatPercent,
  useCurrency,
  useLocale,
  useMessages,
} from "@/core/i18n/client";
import { stageProbability } from "@/data/crm";
import { TonePill } from "@/ds/components";
import { getCustomer, type OpenDeal } from "@/lib/crm";

import { MemberAvatars } from "../../_components/member-avatars";
import { dashboardMessageKey } from "../../_components/messages";
import { stageTones } from "../../_components/stage-tones";
import { crmMessageKey } from "./messages";

export function DealsTable({ deals }: { deals: OpenDeal[] }) {
  const text = useMessages(crmMessageKey);
  const shared = useMessages(dashboardMessageKey);
  const locale = useLocale();
  const currency = useCurrency();
  return (
    <div className="bg-card ring-border glass-surface px-3 py-2 ring-1">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-muted-foreground text-xs font-normal">{text.table.deal}</TableHead>
            <TableHead className="text-muted-foreground text-xs font-normal">{text.table.stage}</TableHead>
            <TableHead className="text-muted-foreground text-xs font-normal">{text.table.closes}</TableHead>
            <TableHead className="text-muted-foreground text-xs font-normal">{text.table.owners}</TableHead>
            <TableHead className="text-muted-foreground text-right text-xs font-normal">{text.table.value}</TableHead>
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
                  {format(shared.deal.stageProbability, locale, {
                    stage: shared.stages[deal.stage],
                    probability: formatPercent(stageProbability[deal.stage], locale),
                  })}
                </TonePill>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatCalendarDate(deal.closeDate, locale, { month: "short", day: "numeric" })}
              </TableCell>
              <TableCell>
                <MemberAvatars ids={deal.ownerIds} />
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatAmount(deal.value, currency, locale, { fractionDigits: 0 })}
              </TableCell>
            </TableRow>
          ))}
          {deals.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground py-10 text-center">
                {text.noMatches}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
