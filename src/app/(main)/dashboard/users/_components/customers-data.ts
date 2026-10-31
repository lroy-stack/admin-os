import { ChartColumn, Phone, UsersRound } from "lucide-react";

import { type Customer, customers } from "@/data/crm";
import type { HeaderKpi } from "@/ds/components";
import { daysSince, openDeals, sumValue } from "@/lib/crm";
import { formatCurrency } from "@/lib/utils";

export type CustomerRow = Customer & { openPipeline: number };

export const customerRows: CustomerRow[] = customers.map((customer) => ({
  ...customer,
  openPipeline: sumValue(openDeals.filter((deal) => deal.customerId === customer.id)),
}));

const joinedThisWeek = customers.filter((customer) => daysSince(`${customer.customerSince}T00:00:00Z`) <= 7).length;
const contactedThisWeek = customers.filter((customer) => daysSince(customer.lastContact) <= 7).length;

export const customerKpis: HeaderKpi[] = [
  {
    icon: UsersRound,
    value: String(customers.length),
    label: "Customers in your book",
    badge: { text: `+${joinedThisWeek} this week`, tone: "azure" },
  },
  {
    icon: Phone,
    value: String(contactedThisWeek),
    label: "Contacted in the last 7 days",
    badge: { text: `${Math.round((contactedThisWeek / customers.length) * 100)}%`, tone: "neutral" },
  },
  {
    icon: ChartColumn,
    value: formatCurrency(sumValue(openDeals), { noDecimals: true }),
    label: "Open pipeline across the book",
  },
];
