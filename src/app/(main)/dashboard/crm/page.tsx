import { LocaleBundles } from "@/app/_components/locale-root";
import { getCurrency, getLocale } from "@/config/locale.server";
import { pageMetadata } from "@/config/metadata.server";
import { localizeDeals } from "@/data/crm-text.server";
import { PageHeader } from "@/ds/components";
import { openDeals } from "@/lib/crm";

import { DealPipeline } from "./_components/deal-pipeline";
import { crmBundle, crmMessages } from "./_components/messages.server";
import { outcomes, pipelineFigures, pipelineKpis } from "./_components/pipeline-data";

export const generateMetadata = () => pageMetadata("/dashboard/crm", crmMessages);

export default async function Page() {
  const [locale, currency] = await Promise.all([getLocale(), getCurrency()]);
  const text = crmMessages[locale];

  return (
    <LocaleBundles bundles={[crmBundle]}>
      <div className="flex flex-col gap-6">
        <PageHeader title={text.title} kpis={pipelineKpis(pipelineFigures, text.kpis, locale, currency)} />
        <DealPipeline deals={localizeDeals(openDeals, locale)} outcomes={outcomes} />
      </div>
    </LocaleBundles>
  );
}
