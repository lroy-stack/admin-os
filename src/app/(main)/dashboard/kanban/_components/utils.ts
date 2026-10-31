import { formatCalendarDate, type Locale } from "@/core/i18n/client";

import { columnIds } from "./data";
import type { BoardState, ColumnId } from "./types";

function isColumnId(id: string): id is ColumnId {
  return columnIds.includes(id as ColumnId);
}

export function findColumnId(board: BoardState, id: string): ColumnId | undefined {
  if (isColumnId(id)) return id;
  return columnIds.find((columnId) => board[columnId].some((task) => task.id === id));
}

export function findTask(board: BoardState, id: string) {
  for (const columnId of columnIds) {
    const task = board[columnId].find((item) => item.id === id);
    if (task) return task;
  }
  return undefined;
}

/** A task's due day ("2026-06-14") as a short date in the locale: "Jun 14", "14 jun", "14. Juni", "14 juin". */
export function formatDueDate(isoDay: string, locale: Locale): string {
  return formatCalendarDate(isoDay, locale, { month: "short", day: "numeric" });
}
