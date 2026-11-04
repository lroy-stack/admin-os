"use client";

import { type Dispatch, type ReactNode, type SetStateAction, useRef } from "react";

import { CollisionPriority } from "@dnd-kit/abstract";
import { move } from "@dnd-kit/helpers";
import { DragDropProvider, useDroppable } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { cn } from "cn";

import { positionOf, type TaskPosition } from "./board-state";
import { opensRecord } from "./open-record";
import { useTaskBoard } from "./task-board-context";
import type { BoardState, ColumnId, Task } from "./types";

export function KanbanListDnd({
  board,
  setBoard,
  children,
}: {
  board: BoardState;
  setBoard: Dispatch<SetStateAction<BoardState>>;
  children: ReactNode;
}) {
  const beforeDrag = useRef(board);
  const taskBoard = useTaskBoard();
  const dragged = useRef<{ id: string; from: TaskPosition | undefined } | null>(null);

  return (
    <DragDropProvider
      onDragStart={(event) => {
        beforeDrag.current = board;
        const id = event.operation.source?.id;
        dragged.current = id === undefined ? null : { id: String(id), from: positionOf(taskBoard.model, String(id)) };
      }}
      onDragOver={(event) => {
        setBoard((current) => move(current, event));
      }}
      onDragEnd={(event) => {
        if (event.canceled || !event.operation.target) {
          setBoard(beforeDrag.current);
          return;
        }
        if (dragged.current) taskBoard.noteDrop(dragged.current.id, dragged.current.from);
      }}
    >
      {children}
    </DragDropProvider>
  );
}

export function KanbanListDropGroup({ columnId, children }: { columnId: ColumnId; children: ReactNode }) {
  const { ref, isDropTarget } = useDroppable({
    id: columnId,
    type: "list-group",
    accept: "list-task",
    collisionPriority: CollisionPriority.Low,
  });

  return (
    <div
      ref={ref}
      data-task-region=""
      tabIndex={-1}
      className={cn("outline-none", isDropTarget && "ring-border ring-1 ring-inset")}
    >
      {children}
    </div>
  );
}

export function SortableListTask({
  task,
  columnId,
  index,
  children,
}: {
  task: Task;
  columnId: ColumnId;
  index: number;
  children: ReactNode;
}) {
  const board = useTaskBoard();
  const { ref, isDragging } = useSortable({
    id: task.id,
    index,
    group: columnId,
    type: "list-task",
    accept: "list-task",
  });

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: the pointer opens the record from the row; the keyboard uses the row's menu (Open task)
    <li
      ref={ref}
      tabIndex={-1}
      aria-label={task.title}
      onClick={(event) => {
        if (opensRecord(event)) board.openPanel(task, event.currentTarget);
      }}
      className={cn(
        "bg-background hover:bg-muted/40 focus-visible:ring-ring flex min-h-12 cursor-grab touch-none items-center gap-2.5 px-4 py-2 outline-none focus-visible:ring-2 focus-visible:ring-inset active:cursor-grabbing lg:px-5.5",
        isDragging && "opacity-40",
      )}
    >
      {children}
    </li>
  );
}
