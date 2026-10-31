import type { Metadata } from "next";

import { PageHeader } from "@/ds/components";

import { HotDeals } from "./_components/hot-deals";
import { hotDeals, overviewKpis, revenueSeries, revenueTarget, stageMix, teamQuota } from "./_components/overview-data";
import { RevenueCard } from "./_components/revenue-card";
import { StageMix } from "./_components/stage-mix";
import { TeamQuota } from "./_components/team-quota";

export const metadata: Metadata = {
  title: "Sales Overview",
  description: "Won revenue against target, the hottest open deals, team quota and the mix of the open pipeline.",
  alternates: {
    canonical: "/dashboard/default",
  },
};

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Sales Overview" kpis={overviewKpis} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.42fr)_minmax(0,1fr)]">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:grid-rows-[auto_1fr]">
          <div className="md:col-span-2">
            <RevenueCard series={revenueSeries} target={revenueTarget} />
          </div>
          <TeamQuota {...teamQuota} />
          <StageMix stages={stageMix} />
        </div>
        <HotDeals deals={hotDeals} />
      </div>
    </div>
  );
}
