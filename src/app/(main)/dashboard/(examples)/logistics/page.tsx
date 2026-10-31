import { LocaleBundles } from "@/app/_components/locale-root";
import { getLocale, getMessages } from "@/config/locale.server";
import { pageMetadata } from "@/config/metadata.server";

import { Logistics } from "./_components/logistics";
import { logisticsBundle, logisticsMessages } from "./_components/messages.server";
import { localizeShipments } from "./_components/shipment-localize";

// Import this stylesheet in any page or component that renders country flag classes.
import "@/styles/flag-icons/flags.css";

export const generateMetadata = () => pageMetadata("/dashboard/logistics", logisticsMessages);

export default async function Page() {
  const [locale, text] = await Promise.all([getLocale(), getMessages(logisticsMessages)]);

  return (
    <LocaleBundles bundles={[logisticsBundle]}>
      <Logistics shipments={localizeShipments(locale, text)} />
    </LocaleBundles>
  );
}
