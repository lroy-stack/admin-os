import { describe, expect, it } from "vitest";

import {
  addTask,
  type BoardModel,
  columnNameOf,
  createModel,
  positionOf,
  relocateTask,
  removeColumn,
  removeTask,
  renameColumn,
  restoreColumn,
  restoreTask,
  type TaskFields,
  type TaskPosition,
  taskById,
  updateTask,
  visibleTaskCount,
} from "./board-state";
import { initialBoard, localizeBoard, taskOwnerProfiles } from "./data";
import { kanbanMessages } from "./messages.server";
import type { Task } from "./types";

const model: BoardModel = createModel(localizeBoard(initialBoard, kanbanMessages.en.tasks));

const fields: TaskFields = {
  title: "Quay lighting",
  description: "Plan the lights.",
  team: "Design",
  priority: "High",
  dueDate: "2026-07-01",
  owner: taskOwnerProfiles[0],
};

// The seed always has this task (the dictionary test checks every id), so the casts hold.
const seed = {
  task: taskById(model, "backup-restore-plan") as Task,
  position: positionOf(model, "backup-restore-plan") as TaskPosition,
};

const ids = (state: BoardModel, column: keyof BoardModel["board"]) => state.board[column].map((task) => task.id);

describe("addTask", () => {
  it("appends the task to its column and to the table order with a session id", () => {
    const { model: next, task } = addTask(model, "planned", fields);

    expect(task.id).toBe("new-1");
    expect(ids(next, "planned").at(-1)).toBe("new-1");
    expect(next.tableOrder.at(-1)).toBe("new-1");
  });

  it("gives every new task its own id", () => {
    const first = addTask(model, "ideas", fields).model;
    const second = addTask(first, "ideas", fields);

    expect(second.task.id).toBe("new-2");
  });

  it("starts a shipped task complete", () => {
    expect(addTask(model, "shipped", fields).task.progress).toBe(100);
  });

  it("starts any other task at zero", () => {
    expect(addTask(model, "building", fields).task.progress).toBe(0);
  });

  it("leaves the previous model untouched", () => {
    addTask(model, "ideas", fields);

    expect(model.created).toBe(0);
  });
});

describe("updateTask", () => {
  it("rewrites the fields of one task", () => {
    const next = updateTask(model, "future-sync-notes", fields);

    expect(taskById(next, "future-sync-notes")).toMatchObject({ title: "Quay lighting", priority: "High" });
  });

  it("keeps the task where it was", () => {
    const next = updateTask(model, "future-sync-notes", fields);

    expect(positionOf(next, "future-sync-notes")).toEqual(positionOf(model, "future-sync-notes"));
  });

  it("ignores an unknown task", () => {
    expect(updateTask(model, "missing", fields)).toBe(model);
  });
});

describe("removeTask and restoreTask", () => {
  it("removes the task from its column", () => {
    expect(taskById(removeTask(model, "backup-restore-plan"), "backup-restore-plan")).toBeUndefined();
  });

  it("removes the task from the table order", () => {
    expect(removeTask(model, "backup-restore-plan").tableOrder).not.toContain("backup-restore-plan");
  });

  it("undo puts the task back in the same place", () => {
    expect(restoreTask(removeTask(model, "backup-restore-plan"), seed.task, seed.position)).toEqual(model);
  });

  it("does not restore a task that is still on the board", () => {
    expect(restoreTask(model, seed.task, seed.position)).toBe(model);
  });
});

describe("relocateTask", () => {
  it("moves a task to the end of another column", () => {
    const next = relocateTask(model, "future-sync-notes", "qa");

    expect(ids(next, "qa").at(-1)).toBe("future-sync-notes");
  });

  it("takes the task out of its first column", () => {
    expect(ids(relocateTask(model, "future-sync-notes", "qa"), "ideas")).not.toContain("future-sync-notes");
  });

  it("undo returns the task to its index in its first column", () => {
    const moved = relocateTask(model, "backup-restore-plan", "shipped");
    const back = relocateTask(moved, "backup-restore-plan", "ideas", 2);

    expect(ids(back, "ideas")).toEqual(ids(model, "ideas"));
  });

  it("reorders inside a column", () => {
    expect(ids(relocateTask(model, "future-sync-notes", "ideas", 0), "ideas")[0]).toBe("future-sync-notes");
  });
});

describe("columns", () => {
  it("renames a column", () => {
    expect(columnNameOf(renameColumn(model, "qa", "  Review  "), "qa", "QA")).toBe("Review");
  });

  it("falls back to the dictionary on an empty name", () => {
    const renamed = renameColumn(model, "qa", "Review");

    expect(columnNameOf(renameColumn(renamed, "qa", " "), "qa", "QA")).toBe("QA");
  });

  it("deletes a column from the screen", () => {
    expect(removeColumn(model, "ideas").columnOrder).not.toContain("ideas");
  });

  it("counts only the tasks of the columns left", () => {
    expect(visibleTaskCount(removeColumn(model, "ideas"))).toBe(visibleTaskCount(model) - model.board.ideas.length);
  });

  it("undo brings the column back at its place with its tasks", () => {
    expect(restoreColumn(removeColumn(model, "planned"), "planned", 1)).toEqual(model);
  });

  it("keeps the last column", () => {
    const one = removeColumn(removeColumn(removeColumn(removeColumn(model, "planned"), "building"), "qa"), "shipped");

    expect(removeColumn(one, "ideas")).toBe(one);
  });
});
