import { getCustomer, getMember, type OpenDeal } from "@/lib/crm";
import type { CsvColumn } from "@/lib/csv";

import type { CrmMessages } from "./messages";

export const DEALS_EXPORT_FILE = "deals.csv";

/**
 * Columns of the exported deals; headers and stage names come from the dictionaries, the close date stays ISO so a
 * spreadsheet can sort it, and the value is the number with its currency in its own column.
 */
export function dealCsvColumns(
  text: CrmMessages["csv"],
  stageNames: Record<OpenDeal["stage"], string>,
  currency: string,
): CsvColumn<OpenDeal>[] {
  return [
    { header: text.deal, value: (deal) => deal.title },
    { header: text.customer, value: (deal) => getCustomer(deal.customerId).company },
    { header: text.stage, value: (deal) => stageNames[deal.stage] },
    { header: text.closes, value: (deal) => deal.closeDate },
    { header: text.owners, value: (deal) => deal.ownerIds.map((id) => getMember(id).name).join("; ") },
    { header: text.value, value: (deal) => deal.value },
    { header: text.currency, value: () => currency },
  ];
}
