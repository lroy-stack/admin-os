"use client";

import * as React from "react";

import { arrayMove } from "@dnd-kit/helpers";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";
import {
  type ColumnFiltersState,
  type ColumnVisibilityState,
  type SortingState,
  useTable,
} from "@tanstack/react-table";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  Settings2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, formatNumber, useLocale, useMessages } from "@/core/i18n/client";
import { dataTableFeatures } from "@/ds/data-table";
import { useToastWithUndo } from "@/ds/feedback";

import { defaultV1MessageKey } from "../messages";
import { createProposalSectionsColumns, DraggableProposalSectionsRow } from "./columns";
import type { ProposalSectionsRow } from "./schema";
import { type SectionEdits, SectionEditsContext } from "./section-edits";

const VIEW_VALUES = ["outline", "past-performance", "key-personnel", "focus-documents"] as const;

type ViewOption = (typeof VIEW_VALUES)[number];

// Demo counts shown on two of the tabs.
const PAST_PERFORMANCE_COUNT = 3;
const KEY_PERSONNEL_COUNT = 2;

/** The toggle-columns menu lists these columns, named in the dictionary. */
type ToggleableColumn = "type" | "status" | "target" | "limit" | "reviewer";

function isToggleableColumn(id: string): id is ToggleableColumn {
  return id === "type" || id === "status" || id === "target" || id === "limit" || id === "reviewer";
}

export function ProposalSectionsTable({ data: initialData }: { data: ProposalSectionsRow[] }) {
  const text = useMessages(defaultV1MessageKey).table;
  const locale = useLocale();
  const columns = React.useMemo(() => createProposalSectionsColumns(text), [text]);
  const viewLabels: Readonly<Record<ViewOption, string>> = {
    outline: text.views.outline,
    "past-performance": text.views.pastPerformance,
    "key-personnel": text.views.keyPersonnel,
    "focus-documents": text.views.focusDocuments,
  };
  const [data, setData] = React.useState(() => initialData);
  const withUndo = useToastWithUndo();
  const edits = React.useMemo<SectionEdits>(
    () => ({
      update: (id, patch) => setData((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row))),
      remove: (row) => {
        const index = data.findIndex((candidate) => candidate.id === row.id);
        setData((current) => current.filter((candidate) => candidate.id !== row.id));
        withUndo({
          message: format(text.toast.deleted, locale, { header: row.header }),
          undo: () => setData((current) => [...current.slice(0, index), row, ...current.slice(index)]),
        });
      },
    }),
    [data, locale, text.toast.deleted, withUndo],
  );
  const [activeView, setActiveView] = React.useState<ViewOption>("outline");
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<ColumnVisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const table = useTable({
    features: dataTableFeatures,
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
  });
  const sortableRowIds = table.getRowModel().rows.map((row) => row.original.id);

  function handleDragEnd(event: DragEndEvent) {
    const { source } = event.operation;

    if (event.canceled || !isSortable(source) || source.initialIndex === source.index) {
      return;
    }

    const destinationId = sortableRowIds[source.index];

    if (destinationId === undefined) {
      return;
    }

    setData((currentData) => {
      const oldIndex = currentData.findIndex((row) => row.id === source.id);
      const newIndex = currentData.findIndex((row) => row.id === destinationId);

      if (oldIndex === -1 || newIndex === -1) {
        return currentData;
      }

      return arrayMove(currentData, oldIndex, newIndex);
    });
  }

  return (
    <SectionEditsContext.Provider value={edits}>
      <Tabs
        value={activeView}
        onValueChange={(value) => setActiveView(value as ViewOption)}
        className="w-full flex-col justify-start gap-6"
      >
        <div className="flex items-center justify-between">
          <Label htmlFor="view-selector" className="sr-only">
            {text.viewLabel}
          </Label>
          <Select value={activeView} onValueChange={(value) => setActiveView(value as ViewOption)}>
            <SelectTrigger className="flex w-fit @4xl/main:hidden" size="sm" id="view-selector">
              <SelectValue placeholder={text.selectView} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {VIEW_VALUES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {viewLabels[value]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
            <TabsTrigger value="outline">{viewLabels.outline}</TabsTrigger>
            <TabsTrigger value="past-performance">
              {viewLabels["past-performance"]}{" "}
              <Badge variant="secondary">{formatNumber(PAST_PERFORMANCE_COUNT, locale)}</Badge>
            </TabsTrigger>
            <TabsTrigger value="key-personnel">
              {viewLabels["key-personnel"]}{" "}
              <Badge variant="secondary">{formatNumber(KEY_PERSONNEL_COUNT, locale)}</Badge>
            </TabsTrigger>
            <TabsTrigger value="focus-documents">{viewLabels["focus-documents"]}</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings2 data-icon="inline-start" />
                  {text.view}
                  <ChevronDownIcon data-icon="inline-end" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-35">
                <DropdownMenuLabel>{text.toggleColumns}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllColumns()
                  .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
                  .flatMap((column) => (isToggleableColumn(column.id) ? [{ column, id: column.id }] : []))
                  .map(({ column, id }) => (
                    <DropdownMenuCheckboxItem
                      key={id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {text.columns[id]}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <TabsContent value="outline" className="relative flex flex-col gap-4 overflow-auto">
          <div className="overflow-hidden rounded-lg border">
            <DragDropProvider onDragEnd={handleDragEnd}>
              <Table>
                <TableHeader className="bg-muted sticky top-0 z-10">
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
                    table
                      .getRowModel()
                      .rows.map((row, index) => (
                        <DraggableProposalSectionsRow
                          key={row.id}
                          row={row}
                          index={index}
                          isSelected={Boolean(table.state.rowSelection[row.id])}
                        />
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={table.getVisibleLeafColumns().length} className="h-24 text-center">
                        {text.empty}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </DragDropProvider>
          </div>
          <div className="flex items-center justify-between px-4">
            <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
              {format(text.selected, locale, {
                count: table.getFilteredSelectedRowModel().rows.length,
                total: table.getFilteredRowModel().rows.length,
              })}
            </div>
            <div className="flex w-full items-center gap-8 lg:w-fit">
              <div className="hidden items-center gap-2 lg:flex">
                <Label htmlFor="rows-per-page" className="text-sm font-medium">
                  {text.rowsPerPage}
                </Label>
                <Select
                  value={`${table.state.pagination.pageSize}`}
                  onValueChange={(value) => {
                    table.setPageSize(Number(value));
                  }}
                >
                  <SelectTrigger size="sm" className="w-20" id="rows-per-page">
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
                {format(text.pageOf, locale, {
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
                  <span className="sr-only">{text.firstPage}</span>
                  <ChevronsLeftIcon />
                </Button>
                <Button
                  variant="outline"
                  className="size-8"
                  size="icon"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">{text.previousPage}</span>
                  <ChevronLeftIcon />
                </Button>
                <Button
                  variant="outline"
                  className="size-8"
                  size="icon"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">{text.nextPage}</span>
                  <ChevronRightIcon />
                </Button>
                <Button
                  variant="outline"
                  className="hidden size-8 lg:flex"
                  size="icon"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">{text.lastPage}</span>
                  <ChevronsRightIcon />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="past-performance" className="flex flex-col px-4 lg:px-6">
          <div className="aspect-video w-full flex-1 rounded-lg border border-dashed" />
        </TabsContent>
        <TabsContent value="key-personnel" className="flex flex-col px-4 lg:px-6">
          <div className="aspect-video w-full flex-1 rounded-lg border border-dashed" />
        </TabsContent>
        <TabsContent value="focus-documents" className="flex flex-col px-4 lg:px-6">
          <div className="aspect-video w-full flex-1 rounded-lg border border-dashed" />
        </TabsContent>
      </Tabs>
    </SectionEditsContext.Provider>
  );
}
