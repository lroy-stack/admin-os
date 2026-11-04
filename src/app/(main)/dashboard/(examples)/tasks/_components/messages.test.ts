import { describe, expect, it } from "vitest";

import { assertDictionaryParity, LOCALES } from "@/core/i18n";

import { taskRecords } from "./data";
import { tasksMessages } from "./messages.server";
import { localizeTasks, taskTitles } from "./task-titles.server";

describe("Tasks dictionary", () => {
  it("is complete and consistent in all four locales", () => {
    // "Backlog" is the term every task tool uses in all four languages.
    expect(() => assertDictionaryParity(tasksMessages, ["statuses.backlog"])).not.toThrow();
  });
});

describe("Task titles", () => {
  it("are complete and consistent in all four locales", () => {
    expect(() => assertDictionaryParity(taskTitles)).not.toThrow();
  });

  it.each(LOCALES)("gives every task a title in %s", (locale) => {
    const tasks = localizeTasks(locale);

    expect(tasks).toHaveLength(taskRecords.length);
    expect(tasks.filter((task) => task.title.trim() === "")).toEqual([]);
  });
});
