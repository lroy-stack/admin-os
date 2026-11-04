"use client";

import { useSortable } from "@dnd-kit/react/sortable";
import { cn } from "cn";

import { opensRecord } from "./open-record";
import { useTaskBoard } from "./task-board-context";
import { TaskCard } from "./task-card";
import type { ColumnId, Task } from "./types";

export function SortableTaskCard({ task, columnId, index }: { task: Task; columnId: ColumnId; index: number }) {
  const board = useTaskBoard();
  const { isDragging, ref } = useSortable({
    id: task.id,
    index,
    type: "task",
    accept: "task",
    group: columnId,
    data: { type: "task", task, columnId },
  });

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: the pointer opens the record from the card; the keyboard uses the card's menu (Open task)
    <div
      ref={ref}
      // The card is dragged and opened with the pointer; its menu is the keyboard path, so the card itself is neither
      // a button nor a tab stop (dnd-kit would make it both).
      role="presentation"
      tabIndex={-1}
      className={cn("touch-none", isDragging && "opacity-30")}
      onClick={(event) => {
        if (opensRecord(event)) board.openPanel(task, event.currentTarget);
      }}
    >
      <TaskCard task={task} columnId={columnId} />
    </div>
  );
}
