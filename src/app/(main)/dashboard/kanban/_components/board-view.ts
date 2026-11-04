import type { Locale } from "@/core/i18n/client";

import type { columnIds } from "./data";
import type { BoardState, Task, TaskPriority, TaskTeam } from "./types";

/** The order the tasks of a column are shown in. `manual` is the order the board holds (and drag changes). */
export type TaskSort = "manual" | "due" | "priority" | "title";

export const taskSorts = ["manual", "due", "priority", "title"] as const satisfies readonly TaskSort[];

/** What narrows the board, the list and the table. An empty value does not narrow. */
export interface TaskFilters {
  readonly query: string;
  /** An owner's name. */
  readonly owner: string;
  readonly team: TaskTeam | "";
  readonly priority: TaskPriority | "";
  /** A calendar day (`YYYY-MM-DD`): only tasks due on or before it. */
  readonly dueBefore: string;
}

export const NO_FILTERS: TaskFilters = { query: "", owner: "", team: "", priority: "", dueBefore: "" };

/** The filters other than the search box, which has its own field. */
export function activeFilterCount(filters: TaskFilters): number {
  return [filters.owner, filters.team, filters.priority, filters.dueBefore].filter((value) => value !== "").length;
}

export function isFiltering(filters: TaskFilters): boolean {
  return filters.query.trim() !== "" || activeFilterCount(filters) > 0;
}

export function matchesFilters(task: Task, filters: TaskFilters): boolean {
  const query = filters.query.trim().toLowerCase();
  if (query && !`${task.title} ${task.description}`.toLowerCase().includes(query)) return false;
  if (filters.owner && task.owner.name !== filters.owner) return false;
  if (filters.team && task.team !== filters.team) return false;
  if (filters.priority && task.priority !== filters.priority) return false;
  if (filters.dueBefore && task.dueDate > filters.dueBefore) return false;
  return true;
}

const priorityRank: Record<TaskPriority, number> = { High: 0, Medium: 1, Low: 2 };

/** The comparison of a sort; `manual` keeps the order it is given. Ties keep the board order (the sort is stable). */
export function compareTasks(sort: TaskSort, locale: Locale): (a: Task, b: Task) => number {
  switch (sort) {
    case "manual":
      return () => 0;
    case "due":
      return (a, b) => a.dueDate.localeCompare(b.dueDate);
    case "priority":
      return (a, b) => priorityRank[a.priority] - priorityRank[b.priority];
    case "title":
      return (a, b) => a.title.localeCompare(b.title, locale);
    default: {
      const unreachable: never = sort;
      return unreachable;
    }
  }
}

/** The board as the screen shows it: every column filtered, then sorted. */
export function viewBoard(board: BoardState, filters: TaskFilters, sort: TaskSort, locale: Locale): BoardState {
  const compare = compareTasks(sort, locale);
  const view = (tasks: Task[]) => tasks.filter((task) => matchesFilters(task, filters)).sort(compare);
  return {
    ideas: view(board.ideas),
    planned: view(board.planned),
    building: view(board.building),
    qa: view(board.qa),
    shipped: view(board.shipped),
  };
}

/** How many tasks of the visible columns the view shows. */
export function shownCount(view: BoardState, visible: readonly (typeof columnIds)[number][]): number {
  return visible.reduce((total, id) => total + view[id].length, 0);
}
