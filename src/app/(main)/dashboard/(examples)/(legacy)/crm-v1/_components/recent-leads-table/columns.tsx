"use client";
import type { ColumnDef } from "@tanstack/react-table";
import { Subscribe } from "@tanstack/react-table";
import { EllipsisVertical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelative, type Locale } from "@/core/i18n/client";
import type { DataTableFeatures } from "@/ds/data-table";

import type { CrmV1Messages } from "../messages";
import type { RecentLeadRow } from "./schema";

/** The demo's reference instant: "last activity" is written relative to it, so the text is the same on every render. */
export const REFERENCE_TIME = Date.UTC(2026, 9, 31, 12);
export const MINUTE_MS = 60_000;

/** The table's columns in one locale; headers, badges, menu items and relative times come from the dictionary. */
export function createRecentLeadsColumns(
  text: CrmV1Messages,
  locale: Locale,
  onDelete: (row: RecentLeadRow) => void,
): ColumnDef<DataTableFeatures, RecentLeadRow>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Subscribe
            source={table.atoms.rowSelection}
            selector={() =>
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected() && "indeterminate")
            }
          >
            {(checked) => (
              <Checkbox
                checked={checked}
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label={text.table.selectAll}
              />
            )}
          </Subscribe>
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Subscribe source={row.table.atoms.rowSelection} selector={(selection) => Boolean(selection?.[row.id])}>
            {(checked) => (
              <Checkbox
                checked={checked}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label={text.table.selectRow}
              />
            )}
          </Subscribe>
        </div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "id",
      header: text.table.columns.ref,
      cell: ({ row }) => <span className="tabular-nums">{row.original.id}</span>,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: text.table.columns.name,
      cell: ({ row }) => row.original.name,
      enableHiding: false,
    },
    {
      accessorKey: "company",
      header: text.table.columns.company,
      cell: ({ row }) => row.original.company,
    },
    {
      accessorKey: "status",
      header: text.table.columns.status,
      cell: ({ row }) => (
        <Badge variant="secondary" className="h-auto whitespace-normal">
          {text.statuses[row.original.status]}
        </Badge>
      ),
    },
    {
      accessorKey: "source",
      header: text.table.columns.source,
      cell: ({ row }) => (
        <Badge variant="outline" className="h-auto whitespace-normal">
          {text.sources[row.original.source]}
        </Badge>
      ),
    },
    {
      accessorKey: "minutesAgo",
      header: text.table.columns.lastActivity,
      cell: ({ row }) => (
        <span className="text-muted-foreground tabular-nums">
          {formatRelative(REFERENCE_TIME - row.original.minutesAgo * MINUTE_MS, REFERENCE_TIME, locale)}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground flex size-8">
              <EllipsisVertical />
              <span className="sr-only">{text.table.openMenu}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-auto min-w-32">
            <DropdownMenuItem variant="destructive" onSelect={() => onDelete(row.original)}>
              {text.table.menu.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableHiding: false,
    },
  ];
}
