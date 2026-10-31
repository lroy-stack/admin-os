"use client";

import type { Column, ColumnDef } from "@tanstack/react-table";
import { Subscribe } from "@tanstack/react-table";
import { cn } from "cn";
import { ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DataTableFeatures } from "@/ds/data-table";

import { labels, priorities, statuses, type Task } from "./data";
import type { TasksMessages } from "./messages";

const statusStyles: Record<string, string> = {
  backlog: "border-muted-foreground/20 bg-muted text-muted-foreground",
  todo: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  "in progress": "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  done: "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300",
  canceled: "border-muted-foreground/20 bg-muted text-muted-foreground",
};

function SortIcon({ sortDirection }: { sortDirection: false | "asc" | "desc" }) {
  if (sortDirection === "desc") {
    return <ArrowDown data-icon="inline-end" />;
  }

  if (sortDirection === "asc") {
    return <ArrowUp data-icon="inline-end" />;
  }

  return <ArrowUpDown data-icon="inline-end" />;
}

function TitleColumnHeader({
  column,
  text,
}: {
  column: Column<DataTableFeatures, Task, unknown>;
  text: TasksMessages;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground data-[state=open]:bg-accent -ml-3">
          {text.columns.title}
          <SortIcon sortDirection={column.getIsSorted()} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onSelect={() => column.toggleSorting(false)}>
          <ArrowUp />
          {text.sort.ascending}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => column.toggleSorting(true)}>
          <ArrowDown />
          {text.sort.descending}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => column.clearSorting()}>
          <RotateCcw />
          {text.sort.reset}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function createColumns(text: TasksMessages): ColumnDef<DataTableFeatures, Task>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
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
              aria-label={text.row.selectAll}
              className="translate-y-0.5"
            />
          )}
        </Subscribe>
      ),
      cell: ({ row }) => (
        <Subscribe source={row.table.atoms.rowSelection} selector={(selection) => Boolean(selection?.[row.id])}>
          {(checked) => (
            <Checkbox
              checked={checked}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label={text.row.selectRow}
              className="translate-y-0.5"
            />
          )}
        </Subscribe>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "id",
      header: text.columns.task,
      cell: ({ row }) => <div className="text-muted-foreground w-20 font-mono text-sm">{row.getValue("id")}</div>,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: ({ column }) => <TitleColumnHeader column={column} text={text} />,
      cell: ({ row }) => {
        const label = labels.find((label) => label.value === row.original.label);

        return (
          <div className="flex min-w-0 items-center gap-2">
            {label && (
              <Badge className="shrink-0 rounded-sm bg-transparent" variant="outline">
                {text.labels[label.value]}
              </Badge>
            )}
            <span
              className="line-clamp-2 max-w-lg min-w-0 text-sm font-medium break-words hyphens-auto"
              title={row.original.title}
            >
              {row.original.title}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: text.columns.status,
      cell: ({ row }) => {
        const status = statuses.find((status) => status.value === row.getValue("status"));

        if (!status) {
          return null;
        }

        return (
          <Badge className={cn("gap-1.5 rounded-sm border font-medium", statusStyles[status.value])} variant="outline">
            {status.icon && <status.icon className="size-4" />}
            {text.statuses[status.value]}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "priority",
      header: text.columns.priority,
      cell: ({ row }) => {
        const priority = priorities.find((priority) => priority.value === row.getValue("priority"));

        if (!priority) {
          return null;
        }

        return (
          <div className="flex items-center gap-2 text-sm">
            {priority.icon && <priority.icon className="text-muted-foreground size-4" />}
            {text.priorities[priority.value]}
          </div>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const task = row.original as Task;

        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="text-muted-foreground data-[state=open]:bg-muted">
                  <MoreHorizontal />
                  <span className="sr-only">{text.row.openMenu}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-40">
                <DropdownMenuItem>{text.row.edit}</DropdownMenuItem>
                <DropdownMenuItem>{text.row.copy}</DropdownMenuItem>
                <DropdownMenuItem>{text.row.favorite}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>{text.row.labels}</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup value={task.label}>
                      {labels.map((label) => (
                        <DropdownMenuRadioItem key={label.value} value={label.value}>
                          {text.labels[label.value]}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  {text.row.delete}
                  <DropdownMenuShortcut>{text.row.deleteShortcut}</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
