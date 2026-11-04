import { describe, expect, it } from "vitest";

import { initialBoard, localizeBoard } from "./data";
import { kanbanMessages } from "./messages.server";
import { emptyTaskForm, formToFields, taskFormSchema, taskToForm } from "./task-form";

const errors = {
  titleRequired: "title",
  ownerRequired: "owner",
  dueDateInvalid: "due",
  teamInvalid: "team",
  priorityInvalid: "priority",
  statusInvalid: "status",
};
const schema = taskFormSchema(errors);
const valid = {
  ...emptyTaskForm("planned"),
  title: "  Quay lighting ",
  ownerName: "Alex Morgan",
  dueDate: "2026-07-01",
};
const issues = (input: unknown) => {
  const result = schema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
};

describe("taskFormSchema", () => {
  it("accepts a complete form and trims the title", () => {
    expect(schema.parse(valid).title).toBe("Quay lighting");
  });

  it("asks for a title", () => {
    expect(issues({ ...valid, title: "  " })).toEqual(["title"]);
  });

  it("asks for an owner from the team", () => {
    expect(issues({ ...valid, ownerName: "" })).toEqual(["owner"]);
  });

  it("asks for a due day", () => {
    expect(issues({ ...valid, dueDate: "" })).toEqual(["due"]);
  });

  it("reports an impossible day", () => {
    expect(issues({ ...valid, dueDate: "2026-02-31" })).toEqual(["due"]);
  });

  it("reports an unknown column", () => {
    expect(issues({ ...valid, status: "archive" })).toEqual(["status"]);
  });

  it("reports each missing field once", () => {
    expect(issues(emptyTaskForm())).toEqual(["title", "owner", "due"]);
  });
});

describe("form and task", () => {
  const task = localizeBoard(initialBoard, kanbanMessages.en.tasks).qa[0];

  it("fills the form from a task and its column", () => {
    expect(taskToForm(task, "qa")).toMatchObject({ title: task.title, status: "qa", ownerName: task.owner.name });
  });

  it("round-trips a task through the form", () => {
    const { fields, status } = formToFields(schema.parse(taskToForm(task, "qa")));

    expect({ fields, status }).toEqual({
      status: "qa",
      fields: {
        title: task.title,
        description: task.description,
        team: task.team,
        priority: task.priority,
        dueDate: task.dueDate,
        owner: task.owner,
      },
    });
  });

  it("presets the status of a new task", () => {
    expect(emptyTaskForm("building").status).toBe("building");
  });
});
