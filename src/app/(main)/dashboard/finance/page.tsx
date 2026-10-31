import { Download, RotateCw, Settings2 } from "lucide-react";

import { LocaleBundles } from "@/app/_components/locale-root";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLocale } from "@/config/locale.server";
import { pageMetadata } from "@/config/metadata.server";
import { format, formatCalendarDate, formatRelative } from "@/core/i18n/client";

import { BalanceDistributionCard } from "./_components/balance-distribution-card";
import { FinanceNotification } from "./_components/finance-notification";
import { IncomeBreakdown } from "./_components/income-breakdown";
import { financeBundle, financeMessages } from "./_components/messages.server";
import { OverviewKpis } from "./_components/overview-kpis";
import { QuickActions } from "./_components/quick-actions";
import { TransactionsOverviewCard } from "./_components/transactions-overview-card";
import { UpcomingTransactions } from "./_components/upcoming-transactions";
import { Wallet } from "./_components/wallet";

export const generateMetadata = () => pageMetadata("/dashboard/finance", financeMessages);

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export default async function Page() {
  const locale = await getLocale();
  const text = financeMessages[locale];
  const now = Date.now();
  const formattedDate = formatCalendarDate(new Date(now).toISOString().slice(0, 10), locale, { dateStyle: "full" });
  const updated = format(text.header.updated, locale, { time: formatRelative(now - FIVE_MINUTES_MS, now, locale) });

  return (
    <LocaleBundles bundles={[financeBundle]}>
      <div className="flex flex-col gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl tracking-tight">{text.header.title}</h1>
          <p className="text-muted-foreground text-sm">{formattedDate}</p>
        </div>

        <Tabs defaultValue="30-days" className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <TabsList variant="line">
              <TabsTrigger value="30-days">{text.tabs.dashboard}</TabsTrigger>
              <TabsTrigger value="12-months">{text.tabs.accounts}</TabsTrigger>
              <TabsTrigger value="custom">{text.tabs.transactions}</TabsTrigger>
            </TabsList>

            <div className="flex flex-wrap items-center gap-3">
              <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <RotateCw aria-hidden="true" className="size-4" />
                <span>{updated}</span>
              </div>
              <Button size="sm" variant="outline">
                <Settings2 />
                {text.header.settings}
              </Button>
              <Button size="sm" variant="outline">
                <Download data-icon="inline-start" />
                {text.header.export}
              </Button>
            </div>
          </div>

          <TabsContent value="30-days" className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
              <div className="xl:col-span-6">
                <OverviewKpis />
              </div>

              <div className="flex flex-col gap-4 xl:col-span-6">
                <IncomeBreakdown />
                <FinanceNotification />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
              <div className="xl:col-span-7">
                <TransactionsOverviewCard />
              </div>
              <div className="xl:col-span-5">
                <BalanceDistributionCard />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
              <div className="xl:col-span-4">
                <Wallet />
              </div>
              <div className="xl:col-span-4">
                <UpcomingTransactions />
              </div>
              <div className="xl:col-span-4">
                <QuickActions />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="12-months">
            <div className="border-border text-muted-foreground flex h-64 items-center justify-center rounded-xl border border-dashed">
              {text.comingSoon.accounts}
            </div>
          </TabsContent>

          <TabsContent value="custom">
            <div className="border-border text-muted-foreground flex h-64 items-center justify-center rounded-xl border border-dashed">
              {text.comingSoon.transactions}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </LocaleBundles>
  );
}
