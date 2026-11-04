"use client";

import { cn } from "cn";
import { Pencil, Trash2 } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";
import { format, formatPercent, useLocale, useMessages } from "@/core/i18n/client";
import { ResponsivePanel, type ReturnFocus } from "@/ds/overlays";
import { getInitials } from "@/lib/utils";

import { tagTones } from "./data";
import { kanbanMessageKey } from "./messages";
import { useTaskBoard } from "./task-board-context";
import { priorityBadgeConfig } from "./task-priority";
import type { ColumnId, Task } from "./types";
import { formatDueDate } from "./utils";

export interface TaskPanelProps {
  task: Task;
  columnId: ColumnId;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocus: ReturnFocus;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (columnId: ColumnId) => void;
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="min-w-0 text-sm font-medium">{children}</dd>
    </div>
  );
}

/**
 * The task's details with Edit, Move to and Delete (ADR 0015: look at a record and act on it). Moving here is the
 * keyboard path next to the cards' menu; the panel stays open and shows the new status.
 */
export function TaskPanel({
  task,
  columnId,
  open,
  onOpenChange,
  returnFocus,
  onEdit,
  onDelete,
  onMove,
}: TaskPanelProps) {
  const text = useMessages(kanbanMessageKey);
  const copy = text.task.panel;
  const locale = useLocale();
  const board = useTaskBoard();
  const priority = priorityBadgeConfig[task.priority];
  const PriorityIcon = priority.icon;

  return (
    <ResponsivePanel
      open={open}
      onOpenChange={onOpenChange}
      returnFocus={returnFocus}
      title={task.title}
      description={format(copy.description, locale, { column: board.columnName(columnId) })}
      headerClassName="text-left"
    >
      <div className="flex flex-col gap-4 px-4">
        <p className="text-muted-foreground text-sm leading-5 break-words">{task.description}</p>
        <dl className="divide-border divide-y">
          <Detail label={copy.priority}>
            <Badge variant={priority.variant} className={cn("rounded-md border-transparent px-2", priority.className)}>
              <PriorityIcon data-icon="inline-start" />
              {text.priorities[task.priority]}
            </Badge>
          </Detail>
          <Detail label={copy.team}>
            <Badge variant="secondary" className={cn("rounded-md border-transparent px-2", tagTones[task.team])}>
              {text.teams[task.team]}
            </Badge>
          </Detail>
          <Detail label={copy.owner}>
            <span className="flex items-center gap-1.5">
              <Avatar className={cn("size-5 after:rounded-sm", task.owner.tone)}>
                <AvatarFallback className="rounded-sm text-[10px]">{getInitials(task.owner.name)}</AvatarFallback>
              </Avatar>
              {task.owner.name}
            </span>
          </Detail>
          <Detail label={copy.dueDate}>{formatDueDate(task.dueDate, locale)}</Detail>
          <Detail label={copy.progress}>
            <span className="flex items-center gap-2">
              <Progress value={task.progress} className="w-24" />
              <span className="tabular-nums">{formatPercent(task.progress / 100, locale)}</span>
            </span>
          </Detail>
        </dl>
        <div className="flex flex-col gap-2">
          <Label htmlFor="task-panel-status">{copy.moveTo}</Label>
          <NativeSelect
            id="task-panel-status"
            value={columnId}
            onChange={(event) => {
              const next = board.columns.find((column) => column.id === event.target.value);
              if (next) onMove(next.id);
            }}
            className="w-full"
          >
            {board.columns.map((column) => (
              <NativeSelectOption key={column.id} value={column.id}>
                {board.columnName(column.id)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      </div>
      <div className="mt-auto flex flex-col gap-2 p-4">
        <Button type="button" variant="outline" className="w-full" onClick={onEdit}>
          <Pencil data-icon="inline-start" />
          {copy.edit}
        </Button>
        <Button type="button" variant="outline" className="text-destructive w-full" onClick={onDelete}>
          <Trash2 data-icon="inline-start" />
          {copy.delete}
        </Button>
      </div>
    </ResponsivePanel>
  );
}
