import { LocaleBundles } from "@/app/_components/locale-root";
import { getCurrency, getLocale } from "@/config/locale.server";
import { pageMetadata } from "@/config/metadata.server";
import { localizeDeals } from "@/data/crm-text.server";
import { PageHeader } from "@/ds/components";

import { HotDeals } from "./_components/hot-deals";
import { overviewBundle, overviewMessages } from "./_components/messages.server";
import {
  hotDeals,
  overviewFigures,
  revenueSeries,
  revenueTarget,
  stageMix,
  teamQuota,
} from "./_components/overview-data";
import { overviewKpis } from "./_components/overview-kpis";
import { RevenueCard } from "./_components/revenue-card";
import { StageMix } from "./_components/stage-mix";
import { TeamQuota } from "./_components/team-quota";

export const generateMetadata = () => pageMetadata("/dashboard/default", overviewMessages);

export default async function Page() {
  const [locale, currency] = await Promise.all([getLocale(), getCurrency()]);
  const text = overviewMessages[locale];

  return (
    <LocaleBundles bundles={[overviewBundle]}>
      <div className="flex flex-col gap-6">
        <PageHeader title={text.title} kpis={overviewKpis(overviewFigures, text.kpis, locale, currency)} />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.42fr)_minmax(0,1fr)]">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:grid-rows-[auto_1fr]">
            <div className="md:col-span-2">
              <RevenueCard series={revenueSeries} target={revenueTarget} />
            </div>
            <TeamQuota {...teamQuota} />
            <StageMix stages={stageMix} />
          </div>
          <HotDeals deals={localizeDeals(hotDeals, locale)} />
        </div>
      </div>
    </LocaleBundles>
  );
}
