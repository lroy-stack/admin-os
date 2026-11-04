"use client";

import { cn } from "cn";
import { BadgeCheck, CalendarDays, FileText, type LucideIcon, MessageSquare, Paperclip } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { format, formatPercent, useLocale, useMessages } from "@/core/i18n/client";
import { getInitials } from "@/lib/utils";

import { tagTones } from "./data";
import { kanbanMessageKey } from "./messages";
import { TaskMenu } from "./task-menu";
import { priorityBadgeConfig } from "./task-priority";
import type { ColumnId, Task, TaskInsightLabel } from "./types";
import { formatDueDate } from "./utils";

const taskInsightIcons: Record<TaskInsightLabel, LucideIcon> = {
  Attachments: Paperclip,
  Comments: MessageSquare,
  Documents: FileText,
};

export function TaskCard({
  task,
  columnId,
  isOverlay = false,
}: {
  task: Task;
  columnId?: ColumnId;
  isOverlay?: boolean;
}) {
  const text = useMessages(kanbanMessageKey);
  const locale = useLocale();
  const dueDate = formatDueDate(task.dueDate, locale);
  const isDone = columnId === "shipped";
  const showBuildingDetails = columnId === "building" && typeof task.progress === "number";
  const owner = task.owner;
  const PriorityIcon = priorityBadgeConfig[task.priority].icon;

  return (
    <article
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-3 rounded-xl border p-4 shadow-xs",
        isOverlay && "w-68 rotate-1 shadow-lg",
      )}
    >
      <div className="min-w-0 space-y-1.5">
        <div className="flex items-start justify-between gap-3">
          <h3
            className="line-clamp-2 min-w-0 text-sm leading-snug font-medium break-words hyphens-auto"
            title={task.title}
          >
            {task.title}
          </h3>
          <div className="-mt-1 -mr-2 flex shrink-0 items-center gap-1">
            <Badge
              variant={priorityBadgeConfig[task.priority].variant}
              className={cn(
                "shrink-0 rounded-md border-transparent px-2 font-medium",
                priorityBadgeConfig[task.priority].className,
              )}
            >
              <PriorityIcon data-icon="inline-start" />
              {text.priorities[task.priority]}
            </Badge>
            {isOverlay || !columnId ? null : (
              <TaskMenu task={task} columnId={columnId} className="text-muted-foreground" />
            )}
          </div>
        </div>
        <p className="text-muted-foreground line-clamp-2 text-sm leading-5">{task.description}</p>
      </div>

      {!showBuildingDetails ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Avatar className={cn("size-5 after:rounded-sm", owner.tone)}>
              <AvatarFallback className="rounded-sm text-[10px]">{getInitials(owner.name)}</AvatarFallback>
            </Avatar>

            <span className="text-muted-foreground min-w-0 truncate text-sm">{owner.name}</span>
          </div>

          <div className="text-muted-foreground flex min-w-0 items-center gap-1.5">
            <span className="truncate text-sm">{dueDate}</span>
            <CalendarDays className="size-3 shrink-0" />
          </div>
        </div>
      ) : null}

      {showBuildingDetails ? (
        <div className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <div className="text-muted-foreground flex items-center justify-between text-xs">
              <span className="leading-none">{text.card.progress}</span>
              <span className="leading-none tabular-nums">{formatPercent(task.progress / 100, locale)}</span>
            </div>
            <Progress value={task.progress} />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground shrink-0 text-sm">{text.card.owner}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground truncate text-sm">{owner.name}</span>
                <Avatar className={cn("size-5 after:rounded-sm", owner.tone)}>
                  <AvatarFallback className="rounded-sm text-[10px]">{getInitials(owner.name)}</AvatarFallback>
                </Avatar>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground shrink-0 text-sm">{text.card.dueDate}</span>
              <span className="text-muted-foreground flex items-center gap-1.5">
                <span className="truncate text-sm">{dueDate}</span>
                <CalendarDays className="size-3 shrink-0" />
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground shrink-0 text-sm">{text.card.team}</span>
              <Badge
                variant="secondary"
                className={cn("rounded-md border-transparent px-2 font-medium", tagTones[task.team])}
              >
                {text.teams[task.team]}
              </Badge>
            </div>
          </div>
        </div>
      ) : null}

      <Separator />

      <div>
        {isDone ? (
          <div className="flex items-center gap-1 text-sm font-medium text-green-700 dark:text-green-600">
            <BadgeCheck className="size-4" />
            {text.card.done}
          </div>
        ) : null}

        {!isDone ? (
          <div className="text-muted-foreground flex items-center gap-3 text-sm">
            {task.insights.map((insight) => {
              const Icon = taskInsightIcons[insight.label];

              return (
                <span
                  key={insight.label}
                  className="flex items-center gap-1.5 text-sm"
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
          </div>
        ) : null}
      </div>
    </article>
  );
}
