"use client";
import * as React from "react";

import {
  type ColumnFiltersState,
  type ColumnVisibilityState,
  type PaginationState,
  useTable,
} from "@tanstack/react-table";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  Download,
  Settings2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, formatRelative, useLocale, useMessages } from "@/core/i18n/client";
import { dataTableFeatures } from "@/ds/data-table";
import { useToastWithUndo } from "@/ds/feedback";
import { downloadCsv, toCsv } from "@/lib/csv";

import { crmV1MessageKey } from "../messages";
import { createRecentLeadsColumns, MINUTE_MS, REFERENCE_TIME } from "./columns";
import type { RecentLeadRow } from "./schema";

const LEADS_FILE = "recent-leads.csv";

export function RecentLeadsTable({ data: initialData }: { data: RecentLeadRow[] }) {
  const text = useMessages(crmV1MessageKey);
  const t = text.table;
  const locale = useLocale();
  const withUndo = useToastWithUndo();
  const [data, setData] = React.useState(initialData);
  const deleteLead = React.useCallback(
    (lead: RecentLeadRow) => {
      const index = data.findIndex((row) => row.id === lead.id);
      setData((current) => current.filter((row) => row.id !== lead.id));
      withUndo({
        message: format(text.table.deleted, locale, { name: lead.name }),
        undo: () => setData((current) => [...current.slice(0, index), lead, ...current.slice(index)]),
      });
    },
    [data, locale, text.table.deleted, withUndo],
  );
  const columns = React.useMemo(() => createRecentLeadsColumns(text, locale, deleteLead), [text, locale, deleteLead]);
  const columnLabels: Record<string, string> = {
    id: t.columns.ref,
    name: t.columns.name,
    company: t.columns.company,
    status: t.columns.status,
    source: t.columns.source,
    minutesAgo: t.columns.lastActivity,
  };

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<ColumnVisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useTable({
    features: dataTableFeatures,
    data,
    columns,
    state: {
      rowSelection,
      columnVisibility,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
        <CardAction>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings2 data-icon="inline-start" />
                  {t.view}
                  <ChevronDownIcon data-icon="inline-end" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-auto min-w-36">
                <DropdownMenuLabel>{t.toggleColumns}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {table
                    .getAllColumns()
                    .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
                    .map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {columnLabels[column.id] ?? column.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              aria-label={t.export}
              onClick={() =>
                downloadCsv(
                  LEADS_FILE,
                  toCsv(
                    table.getFilteredRowModel().rows.map((row) => row.original),
                    [
                      { header: t.columns.ref, value: (lead) => lead.id },
                      { header: t.columns.name, value: (lead) => lead.name },
                      { header: t.columns.company, value: (lead) => lead.company },
                      { header: t.columns.status, value: (lead) => text.statuses[lead.status] },
                      { header: t.columns.source, value: (lead) => text.sources[lead.source] },
                      {
                        header: t.columns.lastActivity,
                        value: (lead) =>
                          formatRelative(REFERENCE_TIME - lead.minutesAgo * MINUTE_MS, REFERENCE_TIME, locale),
                      },
                    ],
                  ),
                )
              }
            >
              <Download data-icon="inline-start" />
              <span className="hidden lg:inline">{t.export}</span>
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader className="bg-muted">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="**:data-[slot=table-cell]:first:w-8">
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={table.state.rowSelection[row.id] && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={table.getVisibleLeafColumns().length} className="h-24 text-center">
                    {t.empty}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {format(t.selected, locale, {
              selected: table.getFilteredSelectedRowModel().rows.length,
              count: table.getFilteredRowModel().rows.length,
            })}
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="recent-leads-rows-per-page" className="text-sm font-medium">
                {t.rowsPerPage}
              </Label>
              <Select
                value={`${table.state.pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="recent-leads-rows-per-page">
                  <SelectValue placeholder={table.state.pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  <SelectGroup>
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              {format(t.pageOf, locale, {
                page: table.state.pagination.pageIndex + 1,
                pages: table.getPageCount(),
              })}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">{t.firstPage}</span>
                <ChevronsLeftIcon />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">{t.previousPage}</span>
                <ChevronLeftIcon />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">{t.nextPage}</span>
                <ChevronRightIcon />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="hidden size-8 lg:flex"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">{t.lastPage}</span>
                <ChevronsRightIcon />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
