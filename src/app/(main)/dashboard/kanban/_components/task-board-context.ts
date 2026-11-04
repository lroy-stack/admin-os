import { createContext, type Dispatch, type SetStateAction, useContext } from "react";

import type { BoardModel, TaskPosition } from "./board-state";
import type { BoardState, Column, ColumnId, Task } from "./types";

/** What the cards, rows and buttons of the three views can ask of the board. `opener` is the control that asked. */
export interface TaskBoard {
  readonly model: BoardModel;
  /** The columns on screen, left to right. */
  readonly columns: readonly Column[];
  readonly columnName: (id: ColumnId) => string;
  readonly setBoard: Dispatch<SetStateAction<BoardState>>;
  readonly setTableOrder: Dispatch<SetStateAction<string[]>>;
  readonly setColumnOrder: Dispatch<SetStateAction<ColumnId[]>>;
  readonly openPanel: (task: Task, opener: Element | null) => void;
  readonly openEdit: (task: Task, opener: Element | null) => void;
  readonly openCreate: (columnId: ColumnId | undefined, opener: Element | null) => void;
  readonly askDelete: (task: Task, opener: Element | null) => void;
  readonly move: (task: Task, columnId: ColumnId, opener: Element | null) => void;
  readonly openRename: (columnId: ColumnId, opener: Element | null) => void;
  readonly askDeleteColumn: (columnId: ColumnId, opener: Element | null) => void;
  /** Reports where a dragged task started, so a drop in another column offers undo. */
  readonly noteDrop: (taskId: string, from: TaskPosition | undefined) => void;
}

export const TaskBoardContext = createContext<TaskBoard | null>(null);

export function useTaskBoard(): TaskBoard {
  const board = useContext(TaskBoardContext);
  if (!board) throw new Error("useTaskBoard needs a TaskBoardProvider above it");
  return board;
}
