"use client";

import { useMemo } from "react";

import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "cn";
import { CalendarCheck, CalendarClock, CircleCheck, DollarSign, Hash, Truck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatCalendarDate, formatCurrency, useLocale, useMessages } from "@/core/i18n/client";
import type { ViewData } from "@/core/views";
import type { DataTableFeatures } from "@/ds/data-table";

import { InventoryList } from "./list";
import { inventoryViewsMessageKey } from "./messages";
import type { OrderRow } from "./model";

/** The statuses of a purchase order, in the order the filter lists them (`purchaseOrderStatuses`). */
const STATUSES = ["draft", "sent", "received", "cancelled"] as const satisfies readonly OrderRow["status"][];

const statusColors: Record<OrderRow["status"], string> = {
  draft: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  sent: "bg-sky-200 text-sky-800 dark:bg-sky-950 dark:text-sky-400",
  received: "bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400",
  cancelled: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const HEADER_ICONS = {
  id: Hash,
  supplier: Truck,
  status: CircleCheck,
  orderedOn: CalendarCheck,
  expectedOn: CalendarClock,
  total: DollarSign,
};

/** The `inventory.orders` renderer (ADR 0018 §3): what the business has bought or is buying, by supplier. */
export function OrdersView({ data }: { data: ViewData<OrderRow> }) {
  const text = useMessages(inventoryViewsMessageKey).orders;
  const locale = useLocale();

  const columns = useMemo<ColumnDef<DataTableFeatures, OrderRow>[]>(
    () => [
      {
        id: "search",
        accessorFn: (order) => `${order.id} ${order.supplierName ?? ""}`,
        filterFn: "includesString",
        enableSorting: false,
      },
      {
        accessorKey: "id",
        header: text.columns.order,
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.id}</span>,
      },
      {
        id: "supplier",
        accessorFn: (order) => order.supplierName ?? "",
        header: text.columns.supplier,
        cell: ({ row }) => row.original.supplierName ?? text.noSupplier,
      },
      {
        accessorKey: "status",
        header: text.columns.status,
        filterFn: "equalsString",
        cell: ({ row }) => (
          <Badge variant="secondary" className={cn("rounded-md", statusColors[row.original.status])}>
            {text.statuses[row.original.status]}
          </Badge>
        ),
      },
      {
        accessorKey: "orderedOn",
        header: text.columns.orderedOn,
        cell: ({ row }) => formatCalendarDate(row.original.orderedOn, locale),
      },
      {
        id: "expectedOn",
        accessorFn: (order) => order.expectedOn ?? "",
        header: text.columns.expectedOn,
        cell: ({ row }) =>
          row.original.expectedOn === undefined ? text.notSet : formatCalendarDate(row.original.expectedOn, locale),
      },
      {
        id: "total",
        accessorFn: (order) => order.total.amountMinor,
        header: text.columns.total,
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatCurrency(row.original.total.amountMinor, row.original.total.currency, locale)}
          </span>
        ),
      },
    ],
    [text, locale],
  );

  return (
    <InventoryList
      data={data}
      columns={columns}
      text={text}
      headerIcons={HEADER_ICONS}
      rightAligned={["total"]}
      filter={{
        columnId: "status",
        label: text.filters.statusLabel,
        all: text.filters.allStatuses,
        options: STATUSES.map((value) => ({ value, label: text.statuses[value] })),
      }}
      pageSizeId="orders-page-size"
    />
  );
}
