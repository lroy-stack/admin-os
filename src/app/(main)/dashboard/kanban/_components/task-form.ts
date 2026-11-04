import { z } from "zod";

import type { TaskFields } from "./board-state";
import { columnIds, taskOwnerProfiles, taskPriorities, taskTeams } from "./data";
import type { ColumnId, Task } from "./types";

/** The errors the schema reports, already translated. */
export interface TaskFormErrors {
  readonly titleRequired: string;
  readonly ownerRequired: string;
  readonly dueDateInvalid: string;
  readonly teamInvalid: string;
  readonly priorityInvalid: string;
  readonly statusInvalid: string;
}

const ownerNames = taskOwnerProfiles.map((owner) => owner.name);

/** The New task and Edit task form. */
export function taskFormSchema(errors: TaskFormErrors) {
  return z.object({
    title: z.string().trim().min(1, errors.titleRequired),
    description: z.string().trim(),
    status: z.enum(columnIds, { error: errors.statusInvalid }),
    team: z.enum(taskTeams, { error: errors.teamInvalid }),
    priority: z.enum(taskPriorities, { error: errors.priorityInvalid }),
    ownerName: z.string().refine((name) => ownerNames.includes(name), errors.ownerRequired),
    dueDate: z.iso.date({ error: errors.dueDateInvalid }),
  });
}

export type TaskFormValues = z.output<ReturnType<typeof taskFormSchema>>;
export type TaskFormInput = z.input<ReturnType<typeof taskFormSchema>>;

/** A blank form; `status` presets the column the person clicked + in. */
export function emptyTaskForm(status: ColumnId = "ideas"): TaskFormInput {
  return { title: "", description: "", status, team: "Product", priority: "Medium", ownerName: "", dueDate: "" };
}

export function taskToForm(task: Task, status: ColumnId): TaskFormInput {
  return {
    title: task.title,
    description: task.description,
    status,
    team: task.team,
    priority: task.priority,
    ownerName: task.owner.name,
    dueDate: task.dueDate,
  };
}

/** The parsed form as the fields a task carries, and the column it belongs in. The schema has checked the owner. */
export function formToFields(values: TaskFormValues): { fields: TaskFields; status: ColumnId } {
  const owner = taskOwnerProfiles.find((profile) => profile.name === values.ownerName) ?? taskOwnerProfiles[0];
  return {
    status: values.status,
    fields: {
      title: values.title,
      description: values.description,
      team: values.team,
      priority: values.priority,
      dueDate: values.dueDate,
      owner,
    },
  };
}
