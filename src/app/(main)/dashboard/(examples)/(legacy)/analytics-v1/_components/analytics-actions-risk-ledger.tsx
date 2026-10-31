"use client";

import * as React from "react";

import { type ColumnDef, type SortingState, useTable } from "@tanstack/react-table";
import { cn } from "cn";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  formatAmount,
  formatNumber,
  format as formatText,
  type Locale,
  useCurrency,
  useLocale,
  useMessages,
} from "@/core/i18n/client";
import { type DataTableFeatures, dataTableFeatures } from "@/ds/data-table";

import { type LedgerPriority, type LedgerRow, ledgerFigures, ledgerRows } from "./analytics-data";
import { formatDays } from "./analytics-format";
import { type AnalyticsV1Messages, analyticsV1MessageKey } from "./messages";

const priorityTone: Record<LedgerPriority, string> = {
  escalate: "border-destructive/35 bg-destructive/10 text-destructive",
  coach: "border-primary/35 bg-primary/10 text-primary",
  reforecast: "border-amber-500/35 bg-amber-500/10 text-amber-700",
};

/** The ledger's columns in one locale; the header and cell wording comes from the dictionary. */
function createLedgerColumns(
  text: AnalyticsV1Messages["ledger"],
  locale: Locale,
): ColumnDef<DataTableFeatures, LedgerRow>[] {
  return [
    {
      accessorKey: "account",
      header: text.columns.account,
      cell: ({ row }) => (
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-sm font-medium">{row.original.account}</p>
          <p className="text-muted-foreground text-xs">
            {formatText(text.dealStage, locale, {
              dealId: row.original.dealId,
              stage: text.stages[row.original.stage],
            })}
          </p>
        </div>
      ),
    },
    {
      id: "blocker",
      header: text.columns.blocker,
      cell: ({ row }) => (
        <div className="max-w-44 min-w-32 text-xs whitespace-normal">
          {formatText(text.overdueBy, locale, {
            days: formatDays(row.original.overdueDays, locale, { display: "long" }),
          })}
        </div>
      ),
    },
    {
      accessorKey: "owner",
      header: text.columns.owner,
      cell: ({ row }) => <span className="text-xs">{row.original.owner}</span>,
    },
    {
      accessorKey: "idleDays",
      header: text.columns.idle,
      cell: ({ row }) => <span className="text-xs tabular-nums">{formatDays(row.original.idleDays, locale)}</span>,
    },
    {
      id: "closeVariance",
      header: text.columns.closeVariance,
      cell: ({ row }) => (
        <span className="text-xs tabular-nums">
          {formatText(text.overdueShort, locale, { days: formatDays(row.original.overdueDays, locale) })}
        </span>
      ),
    },
    {
      id: "nextAction",
      header: text.columns.nextAction,
      cell: ({ row }) => {
        const { priority } = row.original;
        return (
          <div className="flex max-w-64 min-w-40 flex-col gap-1 whitespace-normal">
            {priority ? (
              <Badge
                variant="outline"
                className={cn("h-auto text-[10px] whitespace-normal uppercase", priorityTone[priority])}
              >
                {text.priorities[priority]}
              </Badge>
            ) : null}
            <p className="text-xs">{text.actions[priority ?? "none"]}</p>
          </div>
        );
      },
    },
    {
      accessorKey: "riskScore",
      header: ({ column }) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="-mr-2 h-8 px-2 text-xs"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {text.columns.riskLadder}
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Badge
            variant="outline"
            className={cn(
              "min-w-12 justify-center font-medium tabular-nums",
              row.original.riskScore >= 80 && "border-destructive/35 bg-destructive/10 text-destructive",
              row.original.riskScore >= 65 &&
                row.original.riskScore < 80 &&
                "border-amber-500/35 bg-amber-500/10 text-amber-700",
            )}
          >
            {formatNumber(row.original.riskScore, locale)}
          </Badge>
        </div>
      ),
    },
  ];
}

export function ActionsRiskLedger() {
  const text = useMessages(analyticsV1MessageKey);
  const locale = useLocale();
  const currency = useCurrency();
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "riskScore", desc: true }]);
  const columns = React.useMemo(() => createLedgerColumns(text.ledger, locale), [text.ledger, locale]);

  const table = useTable({
    features: dataTableFeatures,
    data: ledgerRows,
    columns,
    getRowId: (row) => String(row.id),
    state: { sorting },
    onSortingChange: setSorting,
  });

  const t = text.ledger;

  return (
    <Card className="min-w-0 shadow-xs">
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
        <CardAction>
          <Badge variant="outline" className="font-medium tabular-nums">
            {formatText(t.accounts, locale, { count: ledgerRows.length })}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="bg-muted/20 sm:divide-border/60 grid gap-3 rounded-lg border p-3 text-sm sm:grid-cols-4 sm:divide-x">
          <LedgerStat
            label={t.criticalAccounts}
            value={formatNumber(ledgerFigures.criticalAccounts, locale)}
            detail={formatText(t.criticalDetail, locale, { limit: ledgerFigures.criticalLimit })}
          />
          <LedgerStat
            label={t.escalationsDue}
            value={formatNumber(ledgerFigures.escalationsDue, locale)}
            detail={formatText(t.nextDays, locale, { days: 7 })}
          />
          <LedgerStat
            label={t.medianInactivity}
            value={formatDays(ledgerFigures.medianInactivityDays, locale)}
            detail={t.currentWindow}
          />
          <LedgerStat
            label={t.overdueRevenue}
            value={formatAmount(ledgerFigures.overdueRevenue, currency, locale, { fractionDigits: 0 })}
            detail={t.overdueDetail}
          />
        </div>

        <div className="min-w-0 overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/30">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function LedgerStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 px-0 sm:px-3 first:sm:pl-0 last:sm:pr-0">
      <p className="text-muted-foreground text-xs break-words hyphens-auto">{label}</p>
      <p className="text-base font-semibold tabular-nums">{value}</p>
      <p className="text-muted-foreground text-xs break-words hyphens-auto">{detail}</p>
    </div>
  );
}
