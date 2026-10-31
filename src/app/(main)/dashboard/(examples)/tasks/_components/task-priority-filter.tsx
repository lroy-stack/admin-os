"use client";
import type { ReactTable, RowData } from "@tanstack/react-table";
import { cn } from "cn";
import { ListFilter, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMessages } from "@/core/i18n/client";
import type { DataTableFeatures } from "@/ds/data-table";

import { priorities } from "./data";
import { tasksMessageKey } from "./messages";

interface TaskPriorityFilterProps<TData extends RowData> {
  table: ReactTable<DataTableFeatures, TData>;
}

export function TaskPriorityFilter<TData extends RowData>({ table }: TaskPriorityFilterProps<TData>) {
  const text = useMessages(tasksMessageKey);
  const column = table.getColumn("priority");

  if (!column) {
    return null;
  }

  const priorityColumn = column;
  const selectedValues = new Set(priorityColumn.getFilterValue() as string[]);

  function updateFilter(value: string) {
    if (selectedValues.has(value)) {
      selectedValues.delete(value);
    } else {
      selectedValues.add(value);
    }

    const filterValues = Array.from(selectedValues);
    priorityColumn.setFilterValue(filterValues.length ? filterValues : undefined);
    table.setPageIndex(0);
  }

  function clearFilter() {
    priorityColumn.setFilterValue(undefined);
    table.setPageIndex(0);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn("border-dashed", selectedValues.size > 0 && "bg-muted text-foreground border-solid")}
        >
          <ListFilter data-icon="inline-start" />
          {text.toolbar.priority}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-50">
        <DropdownMenuGroup>
          {priorities.map((priority) => {
            const isSelected = selectedValues.has(priority.value);

            return (
              <DropdownMenuCheckboxItem
                key={priority.value}
                checked={isSelected}
                onCheckedChange={() => updateFilter(priority.value)}
                onSelect={(event) => event.preventDefault()}
              >
                <priority.icon className="text-muted-foreground" />
                {text.priorities[priority.value]}
              </DropdownMenuCheckboxItem>
            );
          })}
        </DropdownMenuGroup>
        {selectedValues.size > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={clearFilter} className="justify-center text-center">
                <X />
                {text.toolbar.clearFilters}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
