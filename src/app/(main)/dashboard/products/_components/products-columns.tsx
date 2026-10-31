"use client";

import { type ColumnDef, Subscribe } from "@tanstack/react-table";
import { cn } from "cn";
import { Copy, MoreHorizontal, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, formatAmount, formatNumber, type Locale } from "@/core/i18n/client";
import type { Currency } from "@/core/money/client";
import type { DataTableFeatures } from "@/ds/data-table";

import type { Product, ProductStatus } from "./data";
import type { ProductsMessages } from "./messages";

const statusColors: Record<ProductStatus, string> = {
  active: "bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400",
  draft: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  archived: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

interface ProductsColumnsOptions {
  text: ProductsMessages;
  locale: Locale;
  currency: Currency;
  onEdit: (product: Product) => void;
  onDuplicate: (product: Product) => void;
}

/** Columns in one locale and the business currency; the table rebuilds them when either changes. */
export function createProductsColumns({
  text,
  locale,
  currency,
  onEdit,
  onDuplicate,
}: ProductsColumnsOptions): ColumnDef<DataTableFeatures, Product>[] {
  return [
    {
      id: "select",
      size: 56,
      minSize: 56,
      maxSize: 56,
      header: ({ table }) => (
        <Subscribe
          source={table.store}
          selector={() => ({
            checked:
              table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && ("indeterminate" as const)),
            disabled: !table.getRowModel().rows.length,
          })}
        >
          {({ checked, disabled }) => (
            <Checkbox
              className="mx-auto"
              aria-label={text.row.selectAll}
              checked={checked}
              disabled={disabled}
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(value === true)}
            />
          )}
        </Subscribe>
      ),
      cell: ({ row }) => (
        <Subscribe source={row.table.atoms.rowSelection} selector={(selection) => Boolean(selection?.[row.id])}>
          {(checked) => (
            <Checkbox
              className="mx-auto"
              aria-label={format(text.row.select, locale, { name: row.original.name })}
              checked={checked}
              onCheckedChange={(value) => row.toggleSelected(value === true)}
            />
          )}
        </Subscribe>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "search",
      accessorFn: (product) => `${product.name} ${product.sku} ${text.categories[product.category]}`,
      filterFn: "includesString",
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: text.columns.product,
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => onEdit(row.original)}
          className="hover:text-primary focus-visible:ring-ring line-clamp-2 block max-w-72 rounded-sm text-left break-words hyphens-auto outline-none focus-visible:ring-2"
        >
          {row.original.name}
        </button>
      ),
    },
    {
      accessorKey: "sku",
      header: text.columns.sku,
      cell: ({ row }) => <span className="text-muted-foreground font-mono text-xs">{row.original.sku}</span>,
    },
    {
      accessorKey: "category",
      header: text.columns.category,
      filterFn: "equalsString",
      cell: ({ row }) => text.categories[row.original.category],
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
      accessorKey: "stock",
      header: text.columns.inventory,
      cell: ({ row }) => (
        <Badge
          variant="secondary"
          className={cn("rounded-md tabular-nums", {
            "bg-rose-200 text-rose-800 dark:bg-rose-950 dark:text-rose-400": row.original.stock === 0,
            "bg-orange-200 text-orange-800 dark:bg-orange-950 dark:text-orange-400":
              row.original.stock > 0 && row.original.stock <= 10,
            "bg-sky-200 text-sky-800 dark:bg-sky-950 dark:text-sky-400": row.original.stock > 10,
          })}
        >
          {row.original.stock === 0 && text.stock.out}
          {row.original.stock > 0 &&
            format(row.original.stock <= 10 ? text.stock.low : text.stock.inStock, locale, {
              count: row.original.stock,
            })}
        </Badge>
      ),
    },
    {
      accessorKey: "price",
      header: text.columns.price,
      cell: ({ row }) => <span className="tabular-nums">{formatAmount(row.original.price, currency, locale)}</span>,
    },
    {
      accessorKey: "sold",
      header: text.columns.unitsSold,
      cell: ({ row }) => <span className="tabular-nums">{formatNumber(row.original.sold, locale)}</span>,
    },
    {
      id: "actions",
      size: 56,
      minSize: 56,
      maxSize: 56,
      header: () => <span className="sr-only">{text.columns.actions}</span>,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={format(text.row.actionsFor, locale, { name: row.original.name })}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => onEdit(row.original)}>
                  <Pencil />
                  {text.row.edit}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    onDuplicate(row.original);
                    row.table.resetColumnFilters();
                    row.table.setPageIndex(0);
                  }}
                >
                  <Copy />
                  {text.row.duplicate}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
}
