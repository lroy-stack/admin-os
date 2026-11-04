import { z } from "zod";

import { type Task, taskLabelValues, taskPriorityValues, taskStatusValues } from "./data";
import type { TaskFields } from "./tasks-state";

/** The errors the schema reports, already translated. */
export interface TaskFormErrors {
  readonly titleRequired: string;
}

/** The Edit task form. */
export function taskFormSchema(errors: TaskFormErrors) {
  return z.object({
    title: z.string().trim().min(1, errors.titleRequired),
    status: z.enum(taskStatusValues),
    label: z.enum(taskLabelValues),
    priority: z.enum(taskPriorityValues),
  });
}

export type TaskFormValues = z.output<ReturnType<typeof taskFormSchema>>;

export function taskToForm(task: Task): TaskFields {
  return { title: task.title, status: task.status, label: task.label, priority: task.priority };
}
