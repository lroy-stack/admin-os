import { LocaleBundles } from "@/app/_components/locale-root";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMessages } from "@/config/locale.server";
import { pageMetadata } from "@/config/metadata.server";

import { CardOverview } from "./_components/card-overview";
import { CashFlowOverview } from "./_components/cash-flow-overview";
import { IncomeReliability } from "./_components/income-reliability";
import { MonthlyCashFlow } from "./_components/kpis/monthly-cash-flow";
import { NetWorth } from "./_components/kpis/net-worth";
import { PrimaryAccount } from "./_components/kpis/primary-account";
import { SavingsRate } from "./_components/kpis/savings-rate";
import { financeV1Bundle, financeV1Messages } from "./_components/messages.server";
import { SpendingBreakdown } from "./_components/spending-breakdown";

export const generateMetadata = () => pageMetadata("/dashboard/finance-v1", financeV1Messages);

export default async function Page() {
  const text = (await getMessages(financeV1Messages)).tabs;

  return (
    <LocaleBundles bundles={[financeV1Bundle]}>
      <div>
        <Tabs className="gap-4" defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">{text.overview}</TabsTrigger>
            <TabsTrigger disabled value="activity">
              {text.activity}
            </TabsTrigger>
            <TabsTrigger disabled value="insights">
              {text.insights}
            </TabsTrigger>
            <TabsTrigger disabled value="utilities">
              {text.utilities}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="flex flex-col gap-4 **:data-[slot=card]:shadow-xs">
              <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card grid grid-cols-1 gap-4 *:data-[slot=card]:gap-2 *:data-[slot=card]:bg-linear-to-t sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
                <PrimaryAccount />
                <NetWorth />
                <MonthlyCashFlow />
                <SavingsRate />
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
                <div className="flex min-w-0 flex-col gap-4">
                  <CashFlowOverview />

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <SpendingBreakdown />
                    <IncomeReliability />
                  </div>
                </div>

                <CardOverview />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </LocaleBundles>
  );
}
