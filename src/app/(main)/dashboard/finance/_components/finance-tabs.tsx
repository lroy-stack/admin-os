"use client";

import { createContext, type ReactNode, useContext, useState } from "react";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatAmount, formatDateTime, useCurrency, useLocale, useMessages } from "@/core/i18n/client";
import { downloadCsv, toCsv } from "@/lib/csv";

import { financeMessageKey } from "./messages";
import { type LedgerRow, weekLedger } from "./spending-data";

const TABS = ["dashboard", "transactions"] as const;
type FinanceTab = (typeof TABS)[number];

const isTab = (value: string): value is FinanceTab => TABS.some((tab) => tab === value);

const FinanceTabContext = createContext<((tab: FinanceTab) => void) | null>(null);

/** Lets a control of the dashboard open the Transactions tab. */
export function useShowTransactions(): () => void {
  const select = useContext(FinanceTabContext);
  if (!select) throw new Error("useShowTransactions needs FinanceTabs above it");
  return () => select("transactions");
}

const LEDGER_FILE = "finance-transactions.csv";

/**
 * The tabs of the finance screen with Export, which saves the rows of the Transactions tab. The dashboard and the
 * header note come from the server; this component owns the selected tab so the dashboard's History shortcut can
 * switch it.
 */
export function FinanceTabs({ updated, dashboard }: { updated: ReactNode; dashboard: ReactNode }) {
  const text = useMessages(financeMessageKey);
  const locale = useLocale();
  const currency = useCurrency();
  const [tab, setTab] = useState<FinanceTab>("dashboard");
  const rows = weekLedger();
  const kindLabel = (row: LedgerRow) => (row.kind === "expense" ? text.spending.expense : text.spending.income);
  const when = (row: LedgerRow) => formatDateTime(row.timestamp, locale, "UTC");

  const exportRows = () =>
    downloadCsv(
      LEDGER_FILE,
      toCsv(rows, [
        { header: text.transactions.date, value: when },
        { header: text.transactions.type, value: kindLabel },
        { header: `${text.transactions.amount} (${currency})`, value: (row) => row.amount },
      ]),
    );

  return (
    <FinanceTabContext.Provider value={setTab}>
      <Tabs value={tab} onValueChange={(value) => isTab(value) && setTab(value)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <TabsList variant="line">
            <TabsTrigger value="dashboard">{text.tabs.dashboard}</TabsTrigger>
            <TabsTrigger value="transactions">{text.tabs.transactions}</TabsTrigger>
          </TabsList>
          <div className="flex flex-wrap items-center gap-3">
            {updated}
            <Button size="sm" variant="outline" onClick={exportRows}>
              <Download data-icon="inline-start" />
              {text.header.export}
            </Button>
          </div>
        </div>

        <TabsContent value="dashboard" className="flex flex-col gap-4">
          {dashboard}
        </TabsContent>

        <TabsContent value="transactions">
          <div className="bg-card overflow-hidden rounded-xl border">
            <Table>
              <TableCaption className="mt-0 p-4 text-left">{text.transactions.caption}</TableCaption>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>{text.transactions.date}</TableHead>
                  <TableHead>{text.transactions.type}</TableHead>
                  <TableHead className="text-right">{text.transactions.amount}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={`${row.timestamp}-${row.kind}`}>
                    <TableCell className="tabular-nums">{when(row)}</TableCell>
                    <TableCell>{kindLabel(row)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatAmount(row.amount, currency, locale)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </FinanceTabContext.Provider>
  );
}
