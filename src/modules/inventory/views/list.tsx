"use client";

import { useRouter } from "next/navigation";

import { type ColumnDef, type ReactTable, useTable } from "@tanstack/react-table";
import { cn } from "cn";
import { ChevronLeft, ChevronRight, type LucideIcon, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, type Plural, useLocale, useMessages } from "@/core/i18n/client";
import type { ViewData } from "@/core/views";
import { type DataTableFeatures, dataTableFeatures } from "@/ds/data-table";
import { ReadState } from "@/ds/feedback";

import { inventoryViewsMessageKey } from "./messages";

interface ListText {
  readonly search: { readonly label: string; readonly placeholder: string };
  readonly empty: { readonly title: string; readonly description: string };
  readonly label: string;
  readonly pagesLabel: string;
  readonly range: Plural;
}

/** One column of the table filtered by an exact value: the order's status. */
interface StatusFilter {
  readonly columnId: string;
  readonly label: string;
  readonly all: string;
  readonly options: readonly { readonly value: string; readonly label: string }[];
}

/**
 * The table both inventory views share, built from the same pieces as the catalog collection: a search, an optional
 * filter, a header with icons, and pages. The columns include a hidden `search` column that holds the searched text.
 */
export function InventoryList<Row extends { readonly id: string }>({
  data,
  columns,
  text,
  headerIcons,
  rightAligned = [],
  filter,
  pageSizeId,
}: {
  data: ViewData<Row>;
  columns: ColumnDef<DataTableFeatures, Row>[];
  text: ListText;
  headerIcons: Readonly<Record<string, LucideIcon>>;
  rightAligned?: readonly string[];
  filter?: StatusFilter;
  pageSizeId: string;
}) {
  const pager = useMessages(inventoryViewsMessageKey).pager;
  const locale = useLocale();
  const router = useRouter();

  const table: ReactTable<DataTableFeatures, Row> = useTable({
    features: dataTableFeatures,
    data: data.rows,
    columns,
    initialState: {
      columnVisibility: { search: false },
      pagination: { pageIndex: 0, pageSize: 10 },
    },
    getRowId: (row) => row.id,
    autoResetPageIndex: false,
    enableSorting: false,
  });

  const search = (table.getColumn("search")?.getFilterValue() as string | undefined) ?? "";
  const selected = filter
    ? ((table.getColumn(filter.columnId)?.getFilterValue() as string | undefined) ?? "all")
    : "all";
  const { pageIndex, pageSize } = table.state.pagination;
  const total = table.getFilteredRowModel().rows.length;
  const pageCount = Math.max(1, table.getPageCount());
  const pageStart = Math.max(0, Math.min(pageIndex - 2, pageCount - 5));
  const rangeText = format(text.range, locale, {
    count: total,
    from: total ? pageIndex * pageSize + 1 : 0,
    to: Math.min((pageIndex + 1) * pageSize, total),
    total,
  });
  const pages = Array.from({ length: Math.min(5, pageCount) }, (_, index) => pageStart + index);

  function filterColumn(id: string, value: string) {
    table.getColumn(id)?.setFilterValue(!value || (id !== "search" && value === "all") ? undefined : value);
    table.setPageIndex(0);
  }

  function resetFilters() {
    table.resetColumnFilters();
    table.setPageIndex(0);
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-4 md:px-6">
        <InputGroup className="h-7 w-full rounded-[min(var(--radius-md),10px)] sm:w-64">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            className="h-7"
            type="text"
            aria-label={text.search.label}
            placeholder={text.search.placeholder}
            value={search}
            onChange={(event) => filterColumn("search", event.target.value)}
          />
        </InputGroup>
        <div className="flex flex-wrap items-center gap-2">
          {(search || selected !== "all") && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              {pager.clearFilters}
            </Button>
          )}
          {filter && (
            <Select value={selected} onValueChange={(value) => filterColumn(filter.columnId, value)}>
              <SelectTrigger size="sm" aria-label={filter.label} className="min-w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectGroup>
                  <SelectItem value="all">{filter.all}</SelectItem>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
      <ReadState
        state={data.state}
        reason={data.reason}
        onRetry={() => router.refresh()}
        emptyTitle={text.empty.title}
        emptyDescription={text.empty.description}
      >
        <div className="flex min-h-0 flex-1 flex-col *:data-[slot=table-container]:min-h-0 *:data-[slot=table-container]:flex-1 *:data-[slot=table-container]:overflow-auto">
          <Table
            aria-label={text.label}
            className="border-border/60 min-w-96 border-separate border-spacing-0 border-b"
          >
            <TableHeader className="bg-background sticky top-0 z-10">
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id} className="border-border/60 hover:bg-transparent">
                  {group.headers.map((header) => {
                    const Icon = headerIcons[header.column.id];
                    return (
                      <TableHead
                        key={header.id}
                        style={{ width: header.getSize() }}
                        className="border-border/50 bg-background h-10 border-t border-r border-b px-4.5 font-[450] last:border-r-0"
                      >
                        {!header.isPlaceholder && (
                          <div
                            className={cn(
                              "text-muted-foreground flex w-full items-center gap-2",
                              rightAligned.includes(header.column.id) && "justify-end",
                            )}
                          >
                            {Icon && <Icon className="size-3.5 shrink-0" aria-hidden="true" />}
                            <table.FlexRender header={header} />
                          </div>
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="border-border/60 hover:bg-muted/30 last:*:border-b-0">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                      className={cn(
                        "border-border/50 h-12 border-r border-b px-4.5 py-2 last:border-r-0",
                        rightAligned.includes(cell.column.id) && "text-right",
                      )}
                    >
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {!table.getRowModel().rows.length && (
                <TableRow>
                  <TableCell colSpan={table.getVisibleLeafColumns().length}>
                    <Empty>
                      <EmptyHeader>
                        <EmptyTitle>{pager.noMatchTitle}</EmptyTitle>
                        <EmptyDescription>{pager.noMatchDescription}</EmptyDescription>
                      </EmptyHeader>
                      <Button variant="outline" size="sm" onClick={resetFilters}>
                        {pager.clearFilters}
                      </Button>
                    </Empty>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <footer className="bg-background flex min-h-12 shrink-0 flex-wrap items-center justify-between gap-3 border-t px-4 py-2 text-sm">
            <div className="text-muted-foreground flex flex-wrap items-center gap-4">
              <span className="tabular-nums" aria-live="polite">
                {rangeText}
              </span>
              <div className="flex items-center gap-2">
                <label htmlFor={pageSizeId}>{pager.rowsPerPage}</label>
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => {
                    table.setPageSize(Number(value));
                    table.setPageIndex(0);
                  }}
                >
                  <SelectTrigger id={pageSizeId} size="sm" className="w-16">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="top">
                    <SelectGroup>
                      {[10, 25, 50, 100].map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <nav aria-label={text.pagesLabel} className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                aria-label={pager.previousPage}
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
              >
                <ChevronLeft />
              </Button>
              {pages.map((page) => (
                <Button
                  key={page}
                  variant={page === pageIndex ? "secondary" : "ghost"}
                  size="icon-sm"
                  aria-label={format(pager.page, locale, { page: page + 1 })}
                  aria-current={page === pageIndex ? "page" : undefined}
                  onClick={() => table.setPageIndex(page)}
                >
                  {page + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="icon-sm"
                aria-label={pager.nextPage}
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
              >
                <ChevronRight />
              </Button>
            </nav>
          </footer>
        </div>
      </ReadState>
    </div>
  );
}
