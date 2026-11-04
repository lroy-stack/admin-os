import type { Task, TaskLabel, TaskPriority, TaskStatus } from "./data";

/** What a person can write on a task in the Tasks windows. */
export interface TaskFields {
  readonly title: string;
  readonly status: TaskStatus;
  readonly label: TaskLabel;
  readonly priority: TaskPriority;
}

type TaskPatch = Partial<TaskFields>;

interface TaskCopy {
  readonly task: Task;
  /** The id of the task the copy sits after. */
  readonly after: string;
}

/**
 * The tasks of a session on demo-local state (ADR 0015: a showcase screen keeps demo-local state). It holds only what
 * the session changed, on top of the tasks the page is given, so a language change still re-localizes the demo titles
 * the session did not touch. A reload starts over.
 */
export interface TasksState {
  readonly copies: readonly TaskCopy[];
  readonly patches: Readonly<Record<string, TaskPatch>>;
  readonly removed: readonly string[];
  readonly favorites: readonly string[];
}

export const EMPTY_TASKS_STATE: TasksState = { copies: [], patches: {}, removed: [], favorites: [] };

/** The tasks as the table shows them: edits applied, deleted ones gone, each copy right after its source. */
export function resolveTasks(base: readonly Task[], state: TasksState): Task[] {
  const emit = (task: Task): Task[] => {
    const resolved: Task = { ...task, ...state.patches[task.id] };
    const own = state.removed.includes(task.id) ? [] : [resolved];
    return [...own, ...state.copies.filter((copy) => copy.after === task.id).flatMap((copy) => emit(copy.task))];
  };
  return base.flatMap(emit);
}

export function isFavorite(state: TasksState, id: string): boolean {
  return state.favorites.includes(id);
}

/** The next free `TASK-nnnn` id: one above the highest the page and the session hold. */
export function nextTaskId(base: readonly Task[], state: TasksState): string {
  const numbers = [...base, ...state.copies.map((copy) => copy.task)].map((task) => Number(task.id.replace(/\D/g, "")));
  return `TASK-${Math.max(0, ...numbers) + 1}`;
}

/** Adds a copy of a task, with its edits, right after it; `title` is the copy's (already translated). */
export function copyTask(
  base: readonly Task[],
  state: TasksState,
  id: string,
  title: string,
): { state: TasksState; copy: Task | null } {
  const source = resolveTasks(base, state).find((task) => task.id === id);
  if (!source) return { state, copy: null };
  const copy: Task = { ...source, id: nextTaskId(base, state), title };
  return { state: { ...state, copies: [...state.copies, { task: copy, after: id }] }, copy };
}

export function editTask(state: TasksState, id: string, fields: TaskFields): TasksState {
  return { ...state, patches: { ...state.patches, [id]: { ...state.patches[id], ...fields } } };
}

export function setLabel(state: TasksState, id: string, label: TaskLabel): TasksState {
  return { ...state, patches: { ...state.patches, [id]: { ...state.patches[id], label } } };
}

export function toggleFavorite(state: TasksState, id: string): TasksState {
  const favorites = isFavorite(state, id) ? state.favorites.filter((entry) => entry !== id) : [...state.favorites, id];
  return { ...state, favorites };
}

export function removeTask(state: TasksState, id: string): TasksState {
  return state.removed.includes(id) ? state : { ...state, removed: [...state.removed, id] };
}

/** Undo of `removeTask` and of `copyTask`. */
export function restoreTask(state: TasksState, id: string): TasksState {
  return { ...state, removed: state.removed.filter((entry) => entry !== id) };
}

export function removeCopy(state: TasksState, id: string): TasksState {
  return { ...state, copies: state.copies.filter((copy) => copy.task.id !== id) };
}
