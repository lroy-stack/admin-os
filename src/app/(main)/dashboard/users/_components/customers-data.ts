import { ChartColumn, Phone, UsersRound } from "lucide-react";

import { format, formatAmount, formatNumber, formatPercent, type Locale } from "@/core/i18n/client";
import type { Currency } from "@/core/money";
import { CRM_AS_OF, type Customer, customers } from "@/data/crm";
import type { HeaderKpi } from "@/ds/components";
import { daysSince, openDeals, sumValue } from "@/lib/crm";

import type { CustomerDirectoryMessages } from "./messages";

export type CustomerRow = Customer & { openPipeline: number };

/** The mock "now" of the CRM data, so server and client agree on how long ago a contact was. */
export const CUSTOMERS_AS_OF = new Date(`${CRM_AS_OF}T18:00:00Z`);

export const customerRows: CustomerRow[] = customers.map((customer) => ({
  ...customer,
  openPipeline: sumValue(openDeals.filter((deal) => deal.customerId === customer.id)),
}));

/** The rows with their job titles in the dictionary's language. Throws for a title nobody translated. */
export function localizeCustomers(rows: readonly CustomerRow[], text: CustomerDirectoryMessages): CustomerRow[] {
  return rows.map((row) => {
    const title = text.jobTitles[row.title];
    if (title === undefined) {
      throw new Error(`No translation for the demo job title "${row.title}"; add it to the customers dictionary`);
    }
    return { ...row, title };
  });
}

const joinedThisWeek = customers.filter((customer) => daysSince(`${customer.customerSince}T00:00:00Z`) <= 7).length;
const contactedThisWeek = customers.filter((customer) => daysSince(customer.lastContact) <= 7).length;

/** The page header's KPI chips in one locale and the business currency. */
export function customerKpis(text: CustomerDirectoryMessages["kpis"], locale: Locale, currency: Currency): HeaderKpi[] {
  return [
    {
      icon: UsersRound,
      value: formatNumber(customers.length, locale),
      label: text.customers,
      badge: { text: format(text.newThisWeek, locale, { count: joinedThisWeek }), tone: "azure" },
    },
    {
      icon: Phone,
      value: formatNumber(contactedThisWeek, locale),
      label: text.contacted,
      badge: { text: formatPercent(contactedThisWeek / customers.length, locale), tone: "neutral" },
    },
    {
      icon: ChartColumn,
      value: formatAmount(sumValue(openDeals), currency, locale, { fractionDigits: 0 }),
      label: text.pipeline,
    },
  ];
}
