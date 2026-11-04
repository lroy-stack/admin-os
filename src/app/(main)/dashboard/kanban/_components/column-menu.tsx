"use client";

import { useRef } from "react";

import { MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, useLocale, useMessages } from "@/core/i18n/client";

import { kanbanMessageKey } from "./messages";
import { useTaskBoard } from "./task-board-context";
import type { ColumnId } from "./types";

/** "{column} column actions": Rename (a QuickDialog) and Delete column (a ConfirmAction), on the column's header. */
export function ColumnMenu({ columnId, label }: { columnId: ColumnId; label: string }) {
  const text = useMessages(kanbanMessageKey);
  const board = useTaskBoard();
  const trigger = useRef<HTMLButtonElement>(null);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button ref={trigger} variant="ghost" size="icon-sm" aria-label={label}>
          <MoreVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => board.openRename(columnId, trigger.current)}>
          <Pencil aria-hidden="true" />
          {text.column.menu.rename}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={board.columns.length <= 1}
          onSelect={() => board.askDeleteColumn(columnId, trigger.current)}
        >
          <Trash2 aria-hidden="true" />
          {text.column.menu.delete}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** "Add task to {column}": opens New task with the column preset. */
export function AddTaskToColumn({ columnId }: { columnId: ColumnId }) {
  const text = useMessages(kanbanMessageKey);
  const locale = useLocale();
  const board = useTaskBoard();
  const label = format(text.column.addTask, locale, { column: board.columnName(columnId) });

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      onClick={(event) => board.openCreate(columnId, event.currentTarget)}
    >
      <Plus />
    </Button>
  );
}
