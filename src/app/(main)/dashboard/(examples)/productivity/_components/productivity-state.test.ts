import { describe, expect, it } from "vitest";

import {
  addGoal,
  addNote,
  addProject,
  addTask,
  initialProductivityState,
  inRange,
  matchesProjectFilter,
  scheduledToday,
  toggleTask,
} from "./productivity-state";

describe("inRange", () => {
  it("keeps today out of tomorrow", () => {
    expect(inRange(0, "tomorrow")).toBe(false);
  });

  it("puts day three in this week", () => {
    expect(inRange(3, "thisWeek")).toBe(true);
  });

  it("puts day seven outside this week", () => {
    expect(inRange(7, "thisWeek")).toBe(false);
  });
});

describe("matchesProjectFilter", () => {
  it("calls a project in progress active", () => {
    expect(matchesProjectFilter("inProgress", "active")).toBe(true);
  });

  it("keeps a planning project out of the completed list", () => {
    expect(matchesProjectFilter("planning", "completed")).toBe(false);
  });
});

describe("scheduledToday", () => {
  it("counts the unfinished tasks of today", () => {
    expect(scheduledToday(initialProductivityState.tasks)).toBe(4);
  });

  it("stops counting a task once it is done", () => {
    const state = toggleTask(initialProductivityState, "t1", true);
    expect(scheduledToday(state.tasks)).toBe(3);
  });
});

describe("addTask", () => {
  const state = addTask(initialProductivityState, { title: "Call the bank", tag: "admin", time: "09:00", day: 1 });

  it("appends the task, not done", () => {
    expect(state.tasks.at(-1)).toMatchObject({ title: "Call the bank", done: false, day: 1 });
  });

  it("gives the next task another id", () => {
    const next = addTask(state, { title: "Again", tag: "work", time: "10:00", day: 0 });
    expect(new Set(next.tasks.map((task) => task.id)).size).toBe(next.tasks.length);
  });
});

describe("addProject", () => {
  it("starts a planned project at zero progress", () => {
    const state = addProject(initialProductivityState, {
      title: "Launch",
      description: "Ship it",
      status: "planning",
      dueInDays: 30,
    });
    expect(state.projects.at(-1)?.progress).toBe(0);
  });

  it("starts a completed project at full progress", () => {
    const state = addProject(initialProductivityState, {
      title: "Done",
      description: "",
      status: "completed",
      dueInDays: 0,
    });
    expect(state.projects.at(-1)?.progress).toBe(1);
  });
});

describe("addNote", () => {
  it("puts the new note first, written today", () => {
    expect(addNote(initialProductivityState, "Idea").notes[0]).toMatchObject({ title: "Idea", daysAgo: 0 });
  });
});

describe("addGoal", () => {
  it("counts one more goal", () => {
    expect(addGoal(initialProductivityState).extraGoals).toBe(1);
  });
});
