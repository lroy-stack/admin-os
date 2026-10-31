"use client";
import type { ReactTable, RowData } from "@tanstack/react-table";
import { cn } from "cn";
import { Settings2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useMessages } from "@/core/i18n/client";
import type { DataTableFeatures } from "@/ds/data-table";

import { tasksMessageKey } from "./messages";
import { TaskPriorityFilter } from "./task-priority-filter";
import { TaskStatusFilter } from "./task-status-filter";

type ToggleableColumn = "title" | "status" | "priority";

function isToggleableColumn(id: string): id is ToggleableColumn {
  return id === "title" || id === "status" || id === "priority";
}

interface TasksToolbarProps<TData extends RowData> {
  table: ReactTable<DataTableFeatures, TData>;
}

export function TasksToolbar<TData extends RowData>({ table }: TasksToolbarProps<TData>) {
  const text = useMessages(tasksMessageKey);
  const isFiltered = table.state.columnFilters.length > 0;
  const searchValue = (table.getColumn("title")?.getFilterValue() as string | undefined) ?? "";
  const hideableColumns = table
    .getAllColumns()
    .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
    .flatMap((column) => (isToggleableColumn(column.id) ? [{ column, id: column.id }] : []));
  const hiddenColumns = hideableColumns.filter(({ column }) => !column.getIsVisible());

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Input
          placeholder={text.toolbar.filterPlaceholder}
          aria-label={text.toolbar.filterPlaceholder}
          value={searchValue}
          onChange={(event) => {
            table.getColumn("title")?.setFilterValue(event.target.value);
            table.setPageIndex(0);
          }}
          className="bg-background text-foreground placeholder:text-muted-foreground w-full sm:w-64"
        />
        <TaskStatusFilter table={table} />
        <TaskPriorityFilter table={table} />
        {isFiltered && (
          <Button
            variant="destructive"
            onClick={() => {
              table.resetColumnFilters();
              table.setPageIndex(0);
            }}
          >
            <X data-icon="inline-start" />
            {text.toolbar.reset}
          </Button>
        )}
      </div>
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn("ml-auto hidden lg:flex", hiddenColumns.length > 0 && "bg-muted text-foreground")}
            >
              <Settings2 data-icon="inline-start" />
              {text.toolbar.view}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-38">
            <DropdownMenuLabel>{text.toolbar.toggleColumns}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {hideableColumns.map(({ column, id }) => (
                <DropdownMenuCheckboxItem
                  key={id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {text.columns[id]}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
