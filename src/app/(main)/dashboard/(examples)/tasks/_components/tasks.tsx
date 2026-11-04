"use client";
import * as React from "react";

import {
  type ColumnFiltersState,
  type ColumnVisibilityState,
  type PaginationState,
  type SortingState,
  useTable,
} from "@tanstack/react-table";
import { cn } from "cn";
import { ChevronsLeft, ChevronsRight, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, useLocale, useMessages } from "@/core/i18n/client";
import { dataTableFeatures } from "@/ds/data-table";
import { useToastWithUndo } from "@/ds/feedback";

import { createColumns } from "./columns";
import type { Task } from "./data";
import { tasksMessageKey } from "./messages";
import { TaskEditWindow } from "./task-edit-dialog";
import type { TaskActions } from "./task-row-menu";
import {
  copyTask,
  EMPTY_TASKS_STATE,
  editTask,
  isFavorite,
  removeCopy,
  removeTask,
  resolveTasks,
  restoreTask,
  setLabel,
  toggleFavorite,
} from "./tasks-state";
import { TasksToolbar } from "./tasks-toolbar";

interface TasksProps {
  data: Task[];
}

function preventPaginationNavigation(event: React.MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
}

/** The gap in the page list; decorative, so it carries no text (the ui ellipsis has an English one). */
function PageGap() {
  return (
    <span aria-hidden className="flex size-8 items-center justify-center">
      <MoreHorizontal className="size-4" />
    </span>
  );
}

function getPageNumbers(currentPage: number, pageCount: number) {
  if (pageCount <= 3) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  if (currentPage <= 2) return [1, 2, 3];
  if (currentPage >= pageCount - 1) return [pageCount - 2, pageCount - 1, pageCount];

  return [currentPage - 1, currentPage, currentPage + 1];
}

export function Tasks({ data }: TasksProps) {
  const text = useMessages(tasksMessageKey);
  const locale = useLocale();
  const withUndo = useToastWithUndo();
  const [state, setState] = React.useState(EMPTY_TASKS_STATE);
  const stateRef = React.useRef(state);
  stateRef.current = state;
  const [editing, setEditing] = React.useState<{ task: Task; opening: number; open: boolean } | null>(null);
  const opener = React.useRef<Element | null>(null);
  const region = React.useRef<HTMLDivElement>(null);
  const rows = React.useMemo(() => resolveTasks(data, state), [data, state]);

  const actions = React.useMemo<TaskActions>(() => {
    const focusRegion = () => requestAnimationFrame(() => region.current?.focus());
    return {
      isFavorite: (id) => isFavorite(state, id),
      edit: (task, from) => {
        opener.current = from;
        setEditing((current) => ({ task, opening: (current?.opening ?? 0) + 1, open: true }));
      },
      copy: (task, from) => {
        const result = copyTask(
          data,
          stateRef.current,
          task.id,
          format(text.toast.copyOf, locale, { title: task.title }),
        );
        if (!result.copy) return;
        const { id } = result.copy;
        setState(result.state);
        opener.current = from;
        withUndo({
          message: format(text.toast.copied, locale, { id }),
          undo: () => setState((current) => removeCopy(current, id)),
        });
      },
      toggleFavorite: (task) => {
        const marked = isFavorite(stateRef.current, task.id);
        setState((current) => toggleFavorite(current, task.id));
        toast.success(format(marked ? text.toast.unfavorited : text.toast.favorited, locale, { id: task.id }));
      },
      setLabel: (task, label) => setState((current) => setLabel(current, task.id, label)),
      remove: (task) => {
        setState((current) => removeTask(current, task.id));
        focusRegion();
        withUndo({
          message: format(text.toast.deleted, locale, { id: task.id }),
          undo: () => setState((current) => restoreTask(current, task.id)),
        });
      },
    };
  }, [data, state, text, locale, withUndo]);
  const columns = React.useMemo(() => createColumns(text, actions), [text, actions]);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<ColumnVisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useTable({
    features: dataTableFeatures,
    data: rows,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
  });
  const pageIndex = table.state.pagination.pageIndex;
  const pageCount = Math.max(table.getPageCount(), 1);
  const currentPage = Math.min(pageIndex + 1, pageCount);
  const pageNumbers = getPageNumbers(currentPage, pageCount);
  const canPreviousPage = table.getCanPreviousPage();
  const canNextPage = table.getCanNextPage();

  return (
    <section
      ref={region}
      aria-label={text.table.label}
      tabIndex={-1}
      className="border-border/70 bg-background overflow-hidden rounded-xl border outline-none"
    >
      <div className="border-b px-4 py-4">
        <TasksToolbar table={table} />
      </div>
      <Table className="**:data-[slot=table-cell]:px-4 **:data-[slot=table-head]:px-4">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="text-muted-foreground h-11 font-medium" colSpan={header.colSpan}>
                  {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="border-border/60 hover:bg-muted/20"
                data-state={table.state.rowSelection[row.id] && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-3 align-middle">
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={table.getVisibleLeafColumns().length} className="h-24 text-center">
                {text.table.empty}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex flex-col gap-3 border-t px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="text-muted-foreground text-sm">
          {format(text.table.selected, locale, {
            count: table.getFilteredSelectedRowModel().rows.length,
            total: table.getFilteredRowModel().rows.length,
          })}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-6 lg:gap-8">
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground text-sm font-medium">{text.table.rowsPerPage}</p>
            <Select
              value={`${table.state.pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-18">
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
          <div className="flex min-w-24 items-center justify-start text-sm font-medium whitespace-nowrap sm:justify-center">
            {format(text.table.pageOf, locale, { page: currentPage, pages: pageCount })}
          </div>
          <Pagination aria-label={text.table.pagination} className="mx-0 w-auto justify-start sm:justify-end">
            <PaginationContent className="gap-1">
              <PaginationItem className="hidden lg:block">
                <PaginationLink
                  href="#"
                  aria-label={text.table.firstPage}
                  aria-disabled={!canPreviousPage}
                  className={cn(!canPreviousPage && "pointer-events-none opacity-50")}
                  onClick={(event) => {
                    preventPaginationNavigation(event);
                    if (canPreviousPage) table.setPageIndex(0);
                  }}
                >
                  <ChevronsLeft />
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  text={text.table.previous}
                  aria-label={text.table.previousPage}
                  aria-disabled={!canPreviousPage}
                  className={cn(!canPreviousPage && "pointer-events-none opacity-50")}
                  onClick={(event) => {
                    preventPaginationNavigation(event);
                    if (canPreviousPage) table.previousPage();
                  }}
                />
              </PaginationItem>
              {pageNumbers[0] > 1 ? (
                <PaginationItem>
                  <PageGap />
                </PaginationItem>
              ) : null}
              {pageNumbers.map((pageNumber) => (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    href="#"
                    isActive={pageIndex === pageNumber - 1}
                    onClick={(event) => {
                      preventPaginationNavigation(event);
                      table.setPageIndex(pageNumber - 1);
                    }}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              ))}
              {pageNumbers[pageNumbers.length - 1] < pageCount ? (
                <PaginationItem>
                  <PageGap />
                </PaginationItem>
              ) : null}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  text={text.table.next}
                  aria-label={text.table.nextPage}
                  aria-disabled={!canNextPage}
                  className={cn(!canNextPage && "pointer-events-none opacity-50")}
                  onClick={(event) => {
                    preventPaginationNavigation(event);
                    if (canNextPage) table.nextPage();
                  }}
                />
              </PaginationItem>
              <PaginationItem className="hidden lg:block">
                <PaginationLink
                  href="#"
                  aria-label={text.table.lastPage}
                  aria-disabled={!canNextPage}
                  className={cn(!canNextPage && "pointer-events-none opacity-50")}
                  onClick={(event) => {
                    preventPaginationNavigation(event);
                    if (canNextPage) table.setPageIndex(pageCount - 1);
                  }}
                >
                  <ChevronsRight />
                </PaginationLink>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
      {editing ? (
        <TaskEditWindow
          key={editing.opening}
          task={editing.task}
          open={editing.open}
          onOpenChange={(open) => setEditing((current) => (current ? { ...current, open } : current))}
          returnFocus={() => opener.current}
          onSave={(fields) => {
            setState((current) => editTask(current, editing.task.id, fields));
            toast.success(text.toast.saved);
          }}
        />
      ) : null}
    </section>
  );
}
