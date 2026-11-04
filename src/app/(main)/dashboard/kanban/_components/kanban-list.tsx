"use client";

import { cn } from "cn";
import { FileText, Flame, type LucideIcon, MessageSquare, Paperclip } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format, useLocale, useMessages } from "@/core/i18n/client";
import { getInitials } from "@/lib/utils";

import { AddTaskToColumn, ColumnMenu } from "./column-menu";
import { tagTones } from "./data";
import { KanbanListDropGroup, SortableListTask } from "./kanban-list-dnd";
import { kanbanMessageKey } from "./messages";
import { useTaskBoard } from "./task-board-context";
import { TaskMenu } from "./task-menu";
import { priorityBadgeConfig } from "./task-priority";
import { statusIcons } from "./task-status";
import type { BoardState, Column, TaskInsightLabel } from "./types";
import { formatDueDate } from "./utils";

const insightIcons: Record<TaskInsightLabel, LucideIcon> = {
  Attachments: Paperclip,
  Comments: MessageSquare,
  Documents: FileText,
};

export function KanbanList({ board, columns }: { board: BoardState; columns: readonly Column[] }) {
  const text = useMessages(kanbanMessageKey);
  const locale = useLocale();
  const taskBoard = useTaskBoard();

  return (
    <div className="min-w-0 pb-4">
      {columns.map((column) => {
        const tasks = board[column.id];
        const columnTitle = taskBoard.columnName(column.id);
        const StatusIcon = statusIcons[column.id];
        const highPriorityCount = tasks.filter((task) => task.priority === "High").length;

        return (
          <KanbanListDropGroup key={column.id} columnId={column.id}>
            <Collapsible defaultOpen className="border-b">
              <div className="bg-muted/50 hover:bg-muted flex items-center gap-1 pr-3 lg:pr-4.5">
                <h2 className="min-w-0 flex-1">
                  <CollapsibleTrigger className="focus-visible:ring-ring flex min-h-10 w-full items-center gap-2 py-2 pr-3 pl-4 text-left text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-inset lg:pl-6">
                    <StatusIcon className="text-muted-foreground size-3.5 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 truncate" title={columnTitle}>
                      {columnTitle}
                    </span>
                    <span className="text-muted-foreground shrink-0 font-normal tabular-nums">
                      {tasks.length}
                      <span className="sr-only">{format(text.list.taskUnit, locale, { count: tasks.length })}</span>
                    </span>
                    {highPriorityCount > 0 && (
                      <span className="text-muted-foreground ml-auto hidden shrink-0 items-center gap-1.5 text-xs font-normal sm:flex">
                        <Flame className="text-destructive size-3.5" aria-hidden="true" />
                        {format(text.list.highPriority, locale, { count: highPriorityCount })}
                      </span>
                    )}
                  </CollapsibleTrigger>
                </h2>
                <span className="text-muted-foreground flex items-center">
                  <AddTaskToColumn columnId={column.id} />
                  <ColumnMenu
                    columnId={column.id}
                    label={format(text.list.groupActions, locale, { column: columnTitle })}
                  />
                </span>
              </div>
              <CollapsibleContent>
                <ul aria-label={format(text.list.tasksOf, locale, { column: columnTitle })}>
                  {tasks.map((task, index) => {
                    const priority = priorityBadgeConfig[task.priority];
                    const PriorityIcon = priority.icon;
                    const priorityText = format(text.list.priorityOf, locale, {
                      priority: text.priorities[task.priority],
                    });
                    const dueDate = formatDueDate(task.dueDate, locale);

                    return (
                      <SortableListTask key={task.id} task={task} columnId={column.id} index={index}>
                        <Badge
                          variant={priority.variant}
                          className={cn("size-5 rounded-sm p-0", priority.className)}
                          title={priorityText}
                        >
                          <PriorityIcon aria-hidden="true" />
                          <span className="sr-only">{priorityText}</span>
                        </Badge>
                        <div className="flex min-w-0 flex-1 flex-col items-start gap-2.5 sm:flex-row sm:items-center sm:gap-4">
                          <span
                            className="line-clamp-2 w-full min-w-0 text-sm font-normal break-words hyphens-auto sm:w-auto sm:flex-1"
                            title={task.title}
                          >
                            {task.title}
                          </span>
                          <Badge variant="secondary" className={cn("shrink-0", tagTones[task.team])}>
                            {text.teams[task.team]}
                          </Badge>
                        </div>
                        <span className="text-muted-foreground hidden shrink-0 items-center gap-2.5 text-xs tabular-nums sm:flex">
                          {task.insights
                            .filter((insight) => insight.count > 0)
                            .map((insight) => {
                              const InsightIcon = insightIcons[insight.label];

                              return (
                                <span
                                  key={insight.label}
                                  className="flex items-center gap-1"
                                  title={format(text.insights[insight.label], locale, { count: insight.count })}
                                >
                                  <InsightIcon className="size-3.5" aria-hidden="true" />
                                  <span aria-hidden="true">{insight.count}</span>
                                  <span className="sr-only">
                                    {format(text.insights[insight.label], locale, { count: insight.count })}
                                  </span>
                                </span>
                              );
                            })}
                        </span>
                        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                          <span aria-hidden="true">{dueDate}</span>
                          <span className="sr-only">{format(text.list.due, locale, { date: dueDate })}</span>
                        </span>
                        <div className="flex shrink-0 items-center gap-1.5" title={task.owner.name}>
                          <Avatar className={cn("size-6 after:rounded-sm", task.owner.tone)}>
                            <AvatarFallback className="rounded-sm text-[11px]">
                              <span aria-hidden="true">{getInitials(task.owner.name)}</span>
                              <span className="sr-only">
                                {format(text.list.assignedTo, locale, { name: task.owner.name })}
                              </span>
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <TaskMenu task={task} columnId={column.id} className="text-muted-foreground -mr-2" />
                      </SortableListTask>
                    );
                  })}
                  {tasks.length === 0 && (
                    <li className="text-muted-foreground px-4 py-6 text-sm lg:px-6">{text.list.noTasks}</li>
                  )}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          </KanbanListDropGroup>
        );
      })}
    </div>
  );
}
