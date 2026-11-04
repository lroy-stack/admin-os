import { columnIds } from "./data";
import type { BoardState, ColumnId, Task, TaskFacts } from "./types";

/** What a person can write on a task in the Kanban windows. */
export type TaskFields = Pick<Task, "title" | "description" | "team" | "priority" | "dueDate" | "owner">;

/**
 * The board of a session on demo-local state (ADR 0015: a showcase screen keeps demo-local state): the tasks of every
 * column, the order of the table rows, the visible columns and the names the session gave them. A reload starts over.
 */
export interface BoardModel {
  readonly board: BoardState;
  /** Task ids in the order the table shows them when no sort is chosen. */
  readonly tableOrder: readonly string[];
  /** The columns on screen, left to right. A deleted column leaves this list and keeps its tasks for undo. */
  readonly columnOrder: readonly ColumnId[];
  readonly columnNames: Readonly<Partial<Record<ColumnId, string>>>;
  /** How many tasks the session has created: the next id is `new-{created + 1}`. */
  readonly created: number;
}

/** Where a task sits, enough to put it back (undo). */
export interface TaskPosition {
  readonly columnId: ColumnId;
  readonly index: number;
  readonly tableIndex: number;
}

export function createModel(board: BoardState): BoardModel {
  return {
    board,
    tableOrder: columnIds.flatMap((id) => board[id].map((task) => task.id)),
    columnOrder: columnIds,
    columnNames: {},
    created: 0,
  };
}

function clamp(index: number, length: number): number {
  return Math.max(0, Math.min(index, length));
}

function inserted<T>(items: readonly T[], item: T, index: number): T[] {
  const at = clamp(index, items.length);
  return [...items.slice(0, at), item, ...items.slice(at)];
}

export function positionOf(model: BoardModel, id: string): TaskPosition | undefined {
  for (const columnId of columnIds) {
    const index = model.board[columnId].findIndex((task) => task.id === id);
    if (index >= 0) return { columnId, index, tableIndex: model.tableOrder.indexOf(id) };
  }
  return undefined;
}

export function taskById(model: BoardModel, id: string): Task | undefined {
  const position = positionOf(model, id);
  return position ? model.board[position.columnId][position.index] : undefined;
}

/** The tasks on screen: those of the columns that were not deleted. */
export function visibleTaskCount(model: BoardModel): number {
  return model.columnOrder.reduce((total, id) => total + model.board[id].length, 0);
}

/** Appends a new task to a column; its progress follows the column (a shipped task is complete). */
export function addTask(model: BoardModel, columnId: ColumnId, fields: TaskFields): { model: BoardModel; task: Task } {
  const created = model.created + 1;
  const facts: TaskFacts = {
    id: `new-${created}`,
    priority: fields.priority,
    dueDate: fields.dueDate,
    progress: columnId === "shipped" ? 100 : 0,
    owner: fields.owner,
    team: fields.team,
    insights: [],
  };
  const task: Task = { ...facts, title: fields.title, description: fields.description };
  return {
    model: {
      ...model,
      created,
      board: { ...model.board, [columnId]: [...model.board[columnId], task] },
      tableOrder: [...model.tableOrder, task.id],
    },
    task,
  };
}

export function updateTask(model: BoardModel, id: string, fields: TaskFields): BoardModel {
  const position = positionOf(model, id);
  if (!position) return model;
  const column = model.board[position.columnId].map((task) => (task.id === id ? { ...task, ...fields } : task));
  return { ...model, board: { ...model.board, [position.columnId]: column } };
}

/** Takes a task out of its column and the table order. */
export function removeTask(model: BoardModel, id: string): BoardModel {
  const position = positionOf(model, id);
  if (!position) return model;
  return {
    ...model,
    board: { ...model.board, [position.columnId]: model.board[position.columnId].filter((task) => task.id !== id) },
    tableOrder: model.tableOrder.filter((entry) => entry !== id),
  };
}

/** Undo of `removeTask`: the task goes back where `positionOf` found it. */
export function restoreTask(model: BoardModel, task: Task, position: TaskPosition): BoardModel {
  if (positionOf(model, task.id)) return model;
  return {
    ...model,
    board: {
      ...model.board,
      [position.columnId]: inserted(model.board[position.columnId], task, position.index),
    },
    tableOrder: inserted(model.tableOrder, task.id, position.tableIndex),
  };
}

/** Moves a task to a column, at `index` (default: the end). The table order is untouched. */
export function relocateTask(model: BoardModel, id: string, columnId: ColumnId, index?: number): BoardModel {
  const position = positionOf(model, id);
  const task = taskById(model, id);
  if (!position || !task) return model;
  const without = model.board[position.columnId].filter((entry) => entry.id !== id);
  const target = position.columnId === columnId ? without : model.board[columnId];
  return {
    ...model,
    board: {
      ...model.board,
      [position.columnId]: without,
      [columnId]: inserted(target, task, index ?? target.length),
    },
  };
}

/** The name a column shows: the session's, or the dictionary's. */
export function columnNameOf(model: BoardModel, id: ColumnId, fallback: string): string {
  return model.columnNames[id] ?? fallback;
}

/** Renames a column; an empty name brings the dictionary's back. */
export function renameColumn(model: BoardModel, id: ColumnId, name: string | undefined): BoardModel {
  const { [id]: _previous, ...rest } = model.columnNames;
  const trimmed = name?.trim();
  return { ...model, columnNames: trimmed ? { ...rest, [id]: trimmed } : rest };
}

/** Deletes a column from the screen; its tasks wait in the model so undo brings them back. */
export function removeColumn(model: BoardModel, id: ColumnId): BoardModel {
  if (model.columnOrder.length <= 1) return model;
  return { ...model, columnOrder: model.columnOrder.filter((entry) => entry !== id) };
}

export function restoreColumn(model: BoardModel, id: ColumnId, index: number): BoardModel {
  if (model.columnOrder.includes(id)) return model;
  return { ...model, columnOrder: inserted(model.columnOrder, id, index) };
}
