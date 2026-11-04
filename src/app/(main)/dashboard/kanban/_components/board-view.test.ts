import { describe, expect, it } from "vitest";

import { activeFilterCount, isFiltering, NO_FILTERS, shownCount, viewBoard } from "./board-view";
import { columnIds, initialBoard, localizeBoard } from "./data";
import { kanbanMessages } from "./messages.server";

const board = localizeBoard(initialBoard, kanbanMessages.en.tasks);
const titles = (tasks: { title: string }[]) => tasks.map((task) => task.title);

describe("viewBoard filters", () => {
  it("shows every task when nothing narrows", () => {
    expect(viewBoard(board, NO_FILTERS, "manual", "en")).toEqual(board);
  });

  it("matches the search text against the title, ignoring case", () => {
    const view = viewBoard(board, { ...NO_FILTERS, query: "PAYSLIP" }, "manual", "en");

    expect(titles(view.qa)).toEqual(["Payslip preview"]);
  });

  it("matches the search text against the description", () => {
    const view = viewBoard(board, { ...NO_FILTERS, query: "SheetJS" }, "manual", "en");

    expect(titles(view.building)).toEqual(["Salary Excel import"]);
  });

  it("keeps only the owner's tasks", () => {
    const view = viewBoard(board, { ...NO_FILTERS, owner: "Rohan Iyer" }, "manual", "en");

    expect(shownCount(view, columnIds)).toBe(3);
  });

  it("keeps only the team's tasks", () => {
    const view = viewBoard(board, { ...NO_FILTERS, team: "Finance Ops" }, "manual", "en");

    expect(titles(view.shipped)).toEqual(["Private MVP scope", "MVP module priorities"]);
  });

  it("keeps only the tasks of a priority", () => {
    const view = viewBoard(board, { ...NO_FILTERS, priority: "Low" }, "manual", "en");

    expect(titles(view.ideas)).toEqual(["Future sync notes"]);
  });

  it("keeps the tasks due on or before a day", () => {
    const view = viewBoard(board, { ...NO_FILTERS, dueBefore: "2026-06-12" }, "manual", "en");

    expect(titles(view.shipped)).toEqual(["Architecture rule locked", "Private MVP scope", "MVP module priorities"]);
  });

  it("combines filters", () => {
    const view = viewBoard(board, { ...NO_FILTERS, team: "Platform", priority: "High" }, "manual", "en");

    expect(titles(view.planned)).toEqual(["Electron app shell"]);
  });

  it("does not change the board it is given", () => {
    viewBoard(board, NO_FILTERS, "title", "en");

    expect(titles(board.ideas)[0]).toBe("Tender workflow map");
  });
});

describe("viewBoard sorts", () => {
  it("sorts a column by due date, earliest first", () => {
    const view = viewBoard(board, NO_FILTERS, "due", "en");

    expect(view.planned.map((task) => task.dueDate)).toEqual([...view.planned.map((task) => task.dueDate)].sort());
  });

  it("sorts a column by priority, High first", () => {
    const view = viewBoard(board, NO_FILTERS, "priority", "en");

    expect(view.ideas.map((task) => task.priority)).toEqual(["High", "Medium", "Medium", "Medium", "Low"]);
  });

  it("sorts a column by title in the language", () => {
    const view = viewBoard(board, NO_FILTERS, "title", "en");

    expect(titles(view.ideas)).toEqual([
      "Backup and restore plan",
      "Future sync notes",
      "License strategy research",
      "Tender workflow map",
      "Work order allocation model",
    ]);
  });
});

describe("filter state", () => {
  it("counts the filters other than the search", () => {
    expect(activeFilterCount({ ...NO_FILTERS, query: "x", team: "QA", owner: "Rohan Iyer" })).toBe(2);
  });

  it("is filtering once the search has text", () => {
    expect(isFiltering({ ...NO_FILTERS, query: " a " })).toBe(true);
  });

  it("is not filtering with the defaults", () => {
    expect(isFiltering(NO_FILTERS)).toBe(false);
  });
});
