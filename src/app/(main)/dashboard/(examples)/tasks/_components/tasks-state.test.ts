import { describe, expect, it } from "vitest";

import type { Task } from "./data";
import {
  copyTask,
  EMPTY_TASKS_STATE,
  editTask,
  isFavorite,
  nextTaskId,
  removeCopy,
  removeTask,
  resolveTasks,
  restoreTask,
  setLabel,
  toggleFavorite,
} from "./tasks-state";

const base: Task[] = [
  { id: "TASK-10", title: "First", status: "todo", label: "bug", priority: "high" },
  { id: "TASK-20", title: "Second", status: "done", label: "feature", priority: "low" },
  { id: "TASK-30", title: "Third", status: "backlog", label: "documentation", priority: "medium" },
];

const ids = (tasks: Task[]) => tasks.map((task) => task.id);

describe("resolveTasks", () => {
  it("returns the page's tasks when the session changed nothing", () => {
    expect(resolveTasks(base, EMPTY_TASKS_STATE)).toEqual(base);
  });

  it("applies an edit to one task", () => {
    const state = editTask(EMPTY_TASKS_STATE, "TASK-20", {
      title: "Second, revised",
      status: "in progress",
      label: "bug",
      priority: "high",
    });

    expect(resolveTasks(base, state)[1]).toEqual({
      id: "TASK-20",
      title: "Second, revised",
      status: "in progress",
      label: "bug",
      priority: "high",
    });
  });

  it("drops a deleted task", () => {
    expect(ids(resolveTasks(base, removeTask(EMPTY_TASKS_STATE, "TASK-20")))).toEqual(["TASK-10", "TASK-30"]);
  });

  it("brings a deleted task back on undo", () => {
    const state = restoreTask(removeTask(EMPTY_TASKS_STATE, "TASK-20"), "TASK-20");

    expect(resolveTasks(base, state)).toEqual(base);
  });
});

describe("copyTask", () => {
  it("inserts the copy right after its source with a new id and its own title", () => {
    const { state } = copyTask(base, EMPTY_TASKS_STATE, "TASK-10", "Copy of First");

    expect(ids(resolveTasks(base, state))).toEqual(["TASK-10", "TASK-31", "TASK-20", "TASK-30"]);
  });

  it("copies the task with the edits the session made", () => {
    const edited = setLabel(EMPTY_TASKS_STATE, "TASK-10", "feature");
    const { copy } = copyTask(base, edited, "TASK-10", "Copy of First");

    expect(copy?.label).toBe("feature");
  });

  it("gives a second copy the next id", () => {
    const first = copyTask(base, EMPTY_TASKS_STATE, "TASK-10", "a").state;

    expect(nextTaskId(base, first)).toBe("TASK-32");
  });

  it("copies nothing for an unknown task", () => {
    expect(copyTask(base, EMPTY_TASKS_STATE, "TASK-99", "x").copy).toBeNull();
  });

  it("undo removes the copy", () => {
    const { state, copy } = copyTask(base, EMPTY_TASKS_STATE, "TASK-10", "Copy of First");

    expect(resolveTasks(base, removeCopy(state, copy?.id ?? ""))).toEqual(base);
  });

  it("keeps a copy of a copy after the copy", () => {
    const first = copyTask(base, EMPTY_TASKS_STATE, "TASK-10", "a");
    const second = copyTask(base, first.state, "TASK-31", "b");

    expect(ids(resolveTasks(base, second.state)).slice(0, 3)).toEqual(["TASK-10", "TASK-31", "TASK-32"]);
  });
});

describe("labels and favorites", () => {
  it("sets the label of one task", () => {
    expect(resolveTasks(base, setLabel(EMPTY_TASKS_STATE, "TASK-30", "bug"))[2].label).toBe("bug");
  });

  it("marks a task as a favorite", () => {
    expect(isFavorite(toggleFavorite(EMPTY_TASKS_STATE, "TASK-10"), "TASK-10")).toBe(true);
  });

  it("toggles the favorite off again", () => {
    expect(isFavorite(toggleFavorite(toggleFavorite(EMPTY_TASKS_STATE, "TASK-10"), "TASK-10"), "TASK-10")).toBe(false);
  });
});
