"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "cn";
import { FileText, type LucideIcon, MessageSquare, Paperclip } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, type Locale } from "@/core/i18n/client";
import type { DataTableFeatures } from "@/ds/data-table";
import { getInitials } from "@/lib/utils";

import { tagTones } from "./data";
import type { KanbanMessages } from "./messages";
import { TaskMenu } from "./task-menu";
import { priorityBadgeConfig } from "./task-priority";
import { statusIcons } from "./task-status";
import type { Column, ColumnId, Task, TaskInsightLabel } from "./types";
import { formatDueDate } from "./utils";

export type TaskTableRow = Task & { status: Column };

const insightIcons: Record<TaskInsightLabel, LucideIcon> = {
  Attachments: Paperclip,
  Comments: MessageSquare,
  Documents: FileText,
};

export function createTaskTableColumns(
  columns: readonly Column[],
  onStatusChange: (taskId: string, status: ColumnId) => void,
  onOpen: (task: Task, opener: Element) => void,
  columnName: (id: ColumnId) => string,
  text: KanbanMessages,
  locale: Locale,
): ColumnDef<DataTableFeatures, TaskTableRow>[] {
  return [
    {
      id: "drag",
      header: "",
      size: 48,
      minSize: 48,
      maxSize: 48,
      cell: () => null,
    },
    {
      accessorKey: "title",
      header: text.table.headers.task,
      size: 360,
      cell: ({ row }) => (
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            className="focus-visible:ring-ring min-w-0 flex-1 cursor-pointer truncate rounded-sm text-left outline-none hover:underline focus-visible:ring-2"
            title={row.original.description}
            onClick={(event) => onOpen(row.original, event.currentTarget)}
          >
            {row.original.title}
          </button>
          <span className="text-muted-foreground flex shrink-0 items-center gap-2.5 text-xs tabular-nums">
            {row.original.insights
              .filter((insight) => insight.count > 0)
              .map((insight) => {
                const Icon = insightIcons[insight.label];

                return (
                  <span
                    key={insight.label}
                    className="flex items-center gap-1"
                    title={format(text.insights[insight.label], locale, { count: insight.count })}
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                    <span aria-hidden="true">{insight.count}</span>
                    <span className="sr-only">
                      {format(text.insights[insight.label], locale, { count: insight.count })}
                    </span>
                  </span>
                );
              })}
          </span>
        </div>
      ),
    },
    {
      id: "status",
      accessorFn: (task) => columnName(task.status.id),
      header: text.table.headers.status,
      size: 140,
      cell: ({ row }) => {
        const Icon = statusIcons[row.original.status.id];

        return (
          <Select
            value={row.original.status.id}
            onValueChange={(value) => {
              const status = columns.find((column) => column.id === value);
              if (status) {
                onStatusChange(row.id, status.id);
              }
            }}
          >
            <SelectTrigger
              size="sm"
              className="w-fit gap-1.5 border-transparent bg-transparent px-0 shadow-none"
              aria-label={format(text.table.changeStatus, locale, { title: row.original.title })}
            >
              <Icon className="text-muted-foreground size-3.5 shrink-0" aria-hidden="true" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {columns.map((column) => (
                  <SelectItem key={column.id} value={column.id}>
                    {columnName(column.id)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        );
      },
    },
    {
      accessorKey: "priority",
      header: text.table.headers.priority,
      size: 120,
      cell: ({ row }) => {
        const priority = priorityBadgeConfig[row.original.priority];
        const Icon = priority.icon;

        return (
          <Badge variant={priority.variant} className={cn("rounded-md px-2", priority.className)}>
            <Icon data-icon="inline-start" aria-hidden="true" />
            {text.priorities[row.original.priority]}
          </Badge>
        );
      },
    },
    {
      accessorKey: "team",
      header: text.table.headers.team,
      size: 140,
      cell: ({ row }) => (
        <Badge variant="secondary" className={tagTones[row.original.team]}>
          {text.teams[row.original.team]}
        </Badge>
      ),
    },
    {
      id: "owner",
      accessorFn: (task) => task.owner.name,
      header: text.table.headers.owner,
      size: 190,
      cell: ({ row }) => (
        <span className="flex items-center gap-1.5">
          <Avatar className={cn("size-6 after:rounded-sm", row.original.owner.tone)}>
            <AvatarFallback className="rounded-sm text-[11px]" aria-hidden="true">
              {getInitials(row.original.owner.name)}
            </AvatarFallback>
          </Avatar>
          <span className="text-muted-foreground truncate">{row.original.owner.name}</span>
        </span>
      ),
    },
    {
      accessorKey: "dueDate",
      header: text.table.headers.dueDate,
      size: 160,
      cell: ({ row }) => (
        <span className="text-muted-foreground tabular-nums">{formatDueDate(row.original.dueDate, locale)}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      size: 56,
      cell: ({ row }) => (
        <TaskMenu task={row.original} columnId={row.original.status.id} className="text-muted-foreground" />
      ),
    },
  ];
}
