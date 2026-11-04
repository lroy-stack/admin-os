import { RotateCw } from "lucide-react";

import { LocaleBundles } from "@/app/_components/locale-root";
import { getLocale } from "@/config/locale.server";
import { pageMetadata } from "@/config/metadata.server";
import { format, formatCalendarDate, formatRelative } from "@/core/i18n/client";

import { BalanceDistributionCard } from "./_components/balance-distribution-card";
import { FinanceNotification } from "./_components/finance-notification";
import { FinanceTabs } from "./_components/finance-tabs";
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

        <FinanceTabs
          updated={
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <RotateCw aria-hidden="true" className="size-4" />
              <span>{updated}</span>
            </div>
          }
          dashboard={
            <>
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
            </>
          }
        />
      </div>
    </LocaleBundles>
  );
}
