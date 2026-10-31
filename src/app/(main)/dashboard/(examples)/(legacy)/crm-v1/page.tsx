import { LocaleBundles } from "@/app/_components/locale-root";

import { recentLeadsData } from "./_components/crm.config";
import { InsightCards } from "./_components/insight-cards";
import { crmV1Bundle } from "./_components/messages.server";
import { OperationalCards } from "./_components/operational-cards";
import { OverviewCards } from "./_components/overview-cards";
import { RecentLeadsTable } from "./_components/recent-leads-table/table";

export default function Page() {
  return (
    <LocaleBundles bundles={[crmV1Bundle]}>
      <div className="flex flex-col gap-4 md:gap-6">
        <OverviewCards />
        <InsightCards />
        <OperationalCards />
        <RecentLeadsTable data={recentLeadsData} />
      </div>
    </LocaleBundles>
  );
}
