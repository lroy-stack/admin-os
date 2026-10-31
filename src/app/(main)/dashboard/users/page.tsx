import { LocaleBundles } from "@/app/_components/locale-root";
import { getCurrency, getLocale } from "@/config/locale.server";
import { pageMetadata } from "@/config/metadata.server";
import { PageHeader } from "@/ds/components";

import { CustomerDirectory } from "./_components/customer-directory";
import { customerKpis, customerRows, localizeCustomers } from "./_components/customers-data";
import { customerDirectoryBundle, customerDirectoryMessages } from "./_components/messages.server";

export const generateMetadata = () => pageMetadata("/dashboard/users", customerDirectoryMessages);

export default async function Page() {
  const [locale, currency] = await Promise.all([getLocale(), getCurrency()]);
  const text = customerDirectoryMessages[locale];

  return (
    <LocaleBundles bundles={[customerDirectoryBundle]}>
      <div className="flex flex-col gap-6">
        <PageHeader title={text.title} kpis={customerKpis(text.kpis, locale, currency)} />
        <CustomerDirectory customers={localizeCustomers(customerRows, text)} />
      </div>
    </LocaleBundles>
  );
}
