import { describe, expect, it } from "vitest";

import { taskFormSchema, taskToForm } from "./task-form";

const schema = taskFormSchema({ titleRequired: "title" });
const valid = { title: "  Fix the quay  ", status: "todo", label: "bug", priority: "high" } as const;

describe("taskFormSchema", () => {
  it("trims the title", () => {
    expect(schema.parse(valid).title).toBe("Fix the quay");
  });

  it("asks for a title", () => {
    expect(schema.safeParse({ ...valid, title: " " }).error?.issues.map((issue) => issue.message)).toEqual(["title"]);
  });

  it("rejects a status the table does not know", () => {
    expect(schema.safeParse({ ...valid, status: "archived" }).success).toBe(false);
  });
});

describe("taskToForm", () => {
  it("fills the form from the task's editable fields", () => {
    expect(taskToForm({ id: "TASK-1", ...valid, status: "todo", label: "bug", priority: "high" })).toEqual({
      title: "  Fix the quay  ",
      status: "todo",
      label: "bug",
      priority: "high",
    });
  });
});
