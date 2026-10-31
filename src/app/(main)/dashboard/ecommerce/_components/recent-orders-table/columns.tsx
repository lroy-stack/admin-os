import type { ColumnDef } from "@tanstack/react-table";
import { Subscribe } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, formatAmount, formatDateTime, type Locale } from "@/core/i18n/client";
import type { Currency } from "@/core/money/client";
import type { DataTableFeatures } from "@/ds/data-table";

import type { EcommerceMessages } from "../messages";
import type { OrderFilter, OrderRow } from "./schema";

type OrdersText = EcommerceMessages["orders"];

type BadgeTone = "positive" | "pending" | "negative";

const badgeClasses: Record<BadgeTone, string | undefined> = {
  positive: "border-green-700/25 text-green-700 dark:border-green-300/25 dark:text-green-300",
  pending: "border-yellow-700/25 text-yellow-700 dark:border-yellow-300/25 dark:text-yellow-300",
  negative: undefined,
};

function StatusBadge({ label, tone }: { label: string; tone: BadgeTone }) {
  return (
    <Badge className={badgeClasses[tone]} title={label} variant={tone === "negative" ? "destructive" : "outline"}>
      <span className="size-1.5 shrink-0 rounded-full bg-current" />
      {label}
    </Badge>
  );
}

const paymentTones = { paid: "positive", pending: "pending", refunded: "negative" } as const;
const fulfillmentTones = { fulfilled: "positive", unfulfilled: "negative", returned: "negative" } as const;

/** Whether an order belongs to a status filter chip. */
export function matchesOrderFilter(order: OrderRow, filter: OrderFilter): boolean {
  switch (filter) {
    case "needsAction":
      return (
        order.payment === "pending" ||
        order.payment === "refunded" ||
        order.fulfillment === "unfulfilled" ||
        order.fulfillment === "returned"
      );
    case "unfulfilled":
      return order.fulfillment === "unfulfilled";
    case "unpaid":
      return order.payment === "pending";
    case "returns":
      return order.payment === "refunded" || order.fulfillment === "returned";
    case "all":
      return true;
  }
}

/** Columns in one locale and the business currency; the table rebuilds them when either changes. */
export function createRecentOrdersColumns(
  text: OrdersText,
  locale: Locale,
  currency: Currency,
): ColumnDef<DataTableFeatures, OrderRow>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <div className="w-10">
          <Subscribe
            source={table.atoms.rowSelection}
            selector={() =>
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected() && "indeterminate")
            }
          >
            {(checked) => (
              <Checkbox
                aria-label={text.selectAll}
                checked={checked}
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              />
            )}
          </Subscribe>
        </div>
      ),
      cell: ({ row }) => (
        <div className="w-10">
          <Subscribe source={row.table.atoms.rowSelection} selector={(selection) => Boolean(selection?.[row.id])}>
            {(checked) => (
              <Checkbox
                aria-label={format(text.selectOrder, locale, { id: row.original.id })}
                checked={checked}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
              />
            )}
          </Subscribe>
        </div>
      ),
      enableHiding: false,
      enableSorting: false,
    },
    {
      accessorKey: "id",
      header: text.columns.order,
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <div className="leading-none font-medium">{row.original.id}</div>
          <div className="text-muted-foreground text-xs whitespace-nowrap">
            {format(text.items, locale, { count: row.original.itemCount })}
          </div>
        </div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "customer",
      header: text.columns.customer,
    },
    {
      id: "statusSummary",
      header: text.columns.status,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <StatusBadge label={text.payment[row.original.payment]} tone={paymentTones[row.original.payment]} />
          <StatusBadge
            label={text.fulfillment[row.original.fulfillment]}
            tone={fulfillmentTones[row.original.fulfillment]}
          />
        </div>
      ),
      filterFn: (row, _columnId, value) => matchesOrderFilter(row.original, value as OrderFilter),
    },
    {
      accessorKey: "total",
      header: () => <div className="min-w-28">{text.columns.total}</div>,
      cell: ({ row }) => (
        <div className="min-w-28 tabular-nums">
          {formatAmount(row.original.total, currency, locale, { fractionDigits: 2 })}
        </div>
      ),
    },
    {
      accessorKey: "date",
      header: () => <div className="min-w-44">{text.columns.date}</div>,
      cell: ({ row }) => (
        <div className="text-muted-foreground min-w-44">
          {formatDateTime(new Date(`${row.original.date}Z`), locale, "UTC")}
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="flex w-full justify-end">{text.columns.actions}</div>,
      cell: () => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex w-full justify-end">
              <Button aria-label={text.menu.open} size="icon-sm" variant="ghost">
                <MoreHorizontal />
              </Button>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40">
            <DropdownMenuLabel>{text.menu.label}</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem>{text.menu.view}</DropdownMenuItem>
              <DropdownMenuItem>{text.menu.contact}</DropdownMenuItem>
              <DropdownMenuItem>{text.menu.copyId}</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableHiding: false,
      enableSorting: false,
    },
  ];
}
