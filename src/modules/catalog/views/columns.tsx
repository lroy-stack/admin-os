"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "cn";

import { Badge } from "@/components/ui/badge";
import { formatCurrency, type Locale } from "@/core/i18n/client";
import type { DataTableFeatures } from "@/ds/data-table";

import type { CatalogCollectionMessages } from "./messages";
import type { ProductRow, ProductStatus } from "./model";

const statusColors: Record<ProductStatus, string> = {
  active: "bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400",
  inactive: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  archived: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

/** Columns in one locale; each price carries its own currency, as the catalog stores it. */
export function createProductsColumns({
  text,
  locale,
}: {
  text: CatalogCollectionMessages;
  locale: Locale;
}): ColumnDef<DataTableFeatures, ProductRow>[] {
  return [
    {
      id: "search",
      accessorFn: (product) => product.name,
      filterFn: "includesString",
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: text.columns.product,
      cell: ({ row }) => (
        <span className="line-clamp-2 block max-w-72 break-words hyphens-auto">{row.original.name}</span>
      ),
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
      id: "price",
      accessorFn: (product) => product.price.amountMinor,
      header: text.columns.price,
      cell: ({ row }) => (
        <span className="tabular-nums">
          {formatCurrency(row.original.price.amountMinor, row.original.price.currency, locale)}
        </span>
      ),
    },
  ];
}
