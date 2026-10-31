import { LocaleBundles } from "@/app/_components/locale-root";
import { getLocale } from "@/config/locale.server";
import { pageMetadata } from "@/config/metadata.server";
import { localizeDeals } from "@/data/crm-text.server";
import { dealsClosingWithin, getCustomer } from "@/lib/crm";

import { Calendar } from "./_components/calendar";
import { calendarBundle, calendarMessages } from "./_components/messages.server";

export const generateMetadata = () => pageMetadata("/dashboard/calendar", calendarMessages);

export default async function Page() {
  const locale = await getLocale();
  // Deals closing in the next 30 days, with their titles in the request's locale.
  const closingSoon = localizeDeals(dealsClosingWithin(30).slice(0, 4), locale).map((deal) => ({
    id: deal.id,
    title: deal.title,
    company: getCustomer(deal.customerId).company,
    value: deal.value,
    closeDate: deal.closeDate,
  }));

  return (
    <LocaleBundles bundles={[calendarBundle]}>
      <Calendar closingSoon={closingSoon} />
    </LocaleBundles>
  );
}
