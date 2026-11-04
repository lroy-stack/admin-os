export const taskTags = ["work", "design", "admin", "content", "planning"] as const;
export type TaskTag = (typeof taskTags)[number];

export const taskRanges = ["today", "tomorrow", "thisWeek"] as const;
export type TaskRange = (typeof taskRanges)[number];

export const projectStatuses = ["inProgress", "planning", "completed"] as const;
export type ProjectStatus = (typeof projectStatuses)[number];

/** The filter of the projects list: "active" is what is in progress. */
export const projectFilters = ["active", "planning", "completed"] as const;
export type ProjectFilter = (typeof projectFilters)[number];

export type TaskSeed = "finalizeRoadmap" | "reviewDesignSystem" | "replyToEmails" | "planContent" | "prepareSyncNotes";
export type ProjectSeed = "roadmap" | "website" | "onboarding";
export type NoteSeed = "designPrinciples" | "contentIdeas" | "weeklyLessons" | "books";

/** A task. `seed` names demo text the dictionary writes per language; a task the person adds carries its own `title`. */
export interface Task {
  readonly id: string;
  readonly seed?: TaskSeed;
  readonly title: string;
  readonly tag: TaskTag;
  /** "HH:MM", 24-hour. */
  readonly time: string;
  /** Days from today: 0 is today, 1 tomorrow. */
  readonly day: number;
  readonly done: boolean;
}

export interface Project {
  readonly id: string;
  readonly seed?: ProjectSeed;
  readonly title: string;
  readonly description: string;
  readonly status: ProjectStatus;
  /** A fraction: 0.68 is 68%. */
  readonly progress: number;
  /** Days from today to the due date. */
  readonly dueInDays: number;
}

export interface Note {
  readonly id: string;
  readonly seed?: NoteSeed;
  readonly title: string;
  readonly daysAgo: number;
}

export interface ProductivityState {
  readonly tasks: readonly Task[];
  readonly projects: readonly Project[];
  readonly notes: readonly Note[];
  /** Goals the person added on top of the six the week already counts. */
  readonly extraGoals: number;
  readonly nextId: number;
}

export const initialProductivityState: ProductivityState = {
  tasks: [
    { id: "t1", seed: "finalizeRoadmap", title: "", tag: "work", time: "10:00", day: 0, done: false },
    { id: "t2", seed: "reviewDesignSystem", title: "", tag: "design", time: "11:30", day: 0, done: true },
    { id: "t3", seed: "replyToEmails", title: "", tag: "admin", time: "14:00", day: 0, done: false },
    { id: "t4", seed: "planContent", title: "", tag: "content", time: "16:30", day: 0, done: false },
    { id: "t5", seed: "prepareSyncNotes", title: "", tag: "planning", time: "18:00", day: 0, done: false },
  ],
  projects: [
    { id: "p1", seed: "roadmap", title: "", description: "", status: "inProgress", progress: 0.68, dueInDays: 9 },
    { id: "p2", seed: "website", title: "", description: "", status: "planning", progress: 0.42, dueInDays: 21 },
    { id: "p3", seed: "onboarding", title: "", description: "", status: "planning", progress: 0.31, dueInDays: 18 },
  ],
  notes: [
    { id: "n1", seed: "designPrinciples", title: "", daysAgo: 0 },
    { id: "n2", seed: "contentIdeas", title: "", daysAgo: 1 },
    { id: "n3", seed: "weeklyLessons", title: "", daysAgo: 4 },
    { id: "n4", seed: "books", title: "", daysAgo: 5 },
  ],
  extraGoals: 0,
  nextId: 1,
};

/** Whether a task `day` days from today belongs to the range: "this week" takes the next seven days, today included. */
export function inRange(day: number, range: TaskRange): boolean {
  switch (range) {
    case "today":
      return day === 0;
    case "tomorrow":
      return day === 1;
    case "thisWeek":
      return day >= 0 && day < 7;
  }
}

export function matchesProjectFilter(status: ProjectStatus, filter: ProjectFilter): boolean {
  switch (filter) {
    case "active":
      return status === "inProgress";
    case "planning":
      return status === "planning";
    case "completed":
      return status === "completed";
  }
}

/** Tasks still to do today: what the Today card counts as scheduled. */
export function scheduledToday(tasks: readonly Task[]): number {
  return tasks.filter((task) => task.day === 0 && !task.done).length;
}

export function addTask(state: ProductivityState, fields: Pick<Task, "title" | "tag" | "time" | "day">) {
  const task: Task = { ...fields, id: `new-${state.nextId}`, done: false };
  return { ...state, tasks: [...state.tasks, task], nextId: state.nextId + 1 };
}

export function toggleTask(state: ProductivityState, id: string, done: boolean): ProductivityState {
  return { ...state, tasks: state.tasks.map((task) => (task.id === id ? { ...task, done } : task)) };
}

export function addProject(
  state: ProductivityState,
  fields: Pick<Project, "title" | "description" | "status" | "dueInDays">,
) {
  const project: Project = {
    ...fields,
    id: `new-${state.nextId}`,
    progress: fields.status === "completed" ? 1 : 0,
  };
  return { ...state, projects: [...state.projects, project], nextId: state.nextId + 1 };
}

/** A new note goes first: it was written today. */
export function addNote(state: ProductivityState, title: string): ProductivityState {
  const note: Note = { id: `new-${state.nextId}`, title, daysAgo: 0 };
  return { ...state, notes: [note, ...state.notes], nextId: state.nextId + 1 };
}

export function addGoal(state: ProductivityState): ProductivityState {
  return { ...state, extraGoals: state.extraGoals + 1 };
}
