"use client";

import { useRef } from "react";

import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { type Task, type TaskLabel, taskLabelValues } from "./data";
import type { TasksMessages } from "./messages";

/** What a row's menu can ask of the table. `opener` is the menu's trigger, where focus returns. */
export interface TaskActions {
  readonly isFavorite: (id: string) => boolean;
  readonly edit: (task: Task, opener: Element | null) => void;
  readonly copy: (task: Task, opener: Element | null) => void;
  readonly toggleFavorite: (task: Task, opener: Element | null) => void;
  readonly setLabel: (task: Task, label: TaskLabel, opener: Element | null) => void;
  readonly remove: (task: Task, opener: Element | null) => void;
}

function isLabel(value: string): value is TaskLabel {
  return taskLabelValues.some((label) => label === value);
}

/** Edit, Make a copy, Favorite, Labels and Delete (with undo) for one task. */
export function TaskRowMenu({ task, text, actions }: { task: Task; text: TasksMessages; actions: TaskActions }) {
  const trigger = useRef<HTMLButtonElement>(null);

  return (
    <div className="text-right">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            ref={trigger}
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground data-[state=open]:bg-muted"
          >
            <MoreHorizontal />
            <span className="sr-only">{text.row.openMenu}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40">
          <DropdownMenuItem onSelect={() => actions.edit(task, trigger.current)}>{text.row.edit}</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => actions.copy(task, trigger.current)}>{text.row.copy}</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => actions.toggleFavorite(task, trigger.current)}>
            {actions.isFavorite(task.id) ? text.row.unfavorite : text.row.favorite}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>{text.row.labels}</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={task.label}
                  onValueChange={(value) => {
                    if (isLabel(value)) actions.setLabel(task, value, trigger.current);
                  }}
                >
                  {taskLabelValues.map((label) => (
                    <DropdownMenuRadioItem key={label} value={label}>
                      {text.labels[label]}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => actions.remove(task, trigger.current)}>
            {text.row.delete}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
