"use client";

import { useRef } from "react";

import { ExternalLink, MoreVertical, MoveRight, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, useLocale, useMessages } from "@/core/i18n/client";

import { kanbanMessageKey } from "./messages";
import { useTaskBoard } from "./task-board-context";
import type { ColumnId, Task } from "./types";

/**
 * "More actions for {title}": Open, Edit, Move to column, Delete. It is the keyboard path to everything a card does
 * (the card itself is moved by the pointer). Every action hands the trigger to the board, which returns focus to it
 * or to the task's region when the task leaves the screen.
 */
export function TaskMenu({ task, columnId, className }: { task: Task; columnId: ColumnId; className?: string }) {
  const text = useMessages(kanbanMessageKey);
  const locale = useLocale();
  const board = useTaskBoard();
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = text.task.menu;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          ref={trigger}
          variant="ghost"
          size="icon-sm"
          className={className}
          aria-label={format(text.task.moreActions, locale, { title: task.title })}
        >
          <MoreVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => board.openPanel(task, trigger.current)}>
          <ExternalLink aria-hidden="true" />
          {menu.open}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => board.openEdit(task, trigger.current)}>
          <Pencil aria-hidden="true" />
          {menu.edit}
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <MoveRight aria-hidden="true" />
            {menu.moveTo}
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              {board.columns.map((column) => (
                <DropdownMenuItem
                  key={column.id}
                  disabled={column.id === columnId}
                  onSelect={() => board.move(task, column.id, trigger.current)}
                >
                  {board.columnName(column.id)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => board.askDelete(task, trigger.current)}>
          <Trash2 aria-hidden="true" />
          {menu.delete}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
