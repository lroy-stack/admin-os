import { ArrowDown, ArrowRight, ArrowUp, CheckCircle, Circle, CircleOff, HelpCircle, Timer } from "lucide-react";
import { z } from "zod";

export const taskStatusValues = ["backlog", "todo", "in progress", "done", "canceled"] as const;
export const taskLabelValues = ["bug", "feature", "documentation"] as const;
export const taskPriorityValues = ["low", "medium", "high"] as const;

export type TaskStatus = (typeof taskStatusValues)[number];
export type TaskLabel = (typeof taskLabelValues)[number];
export type TaskPriority = (typeof taskPriorityValues)[number];

const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(taskStatusValues),
  label: z.enum(taskLabelValues),
  priority: z.enum(taskPriorityValues),
});

/** A task with its title in the request's locale (`localizeTasks`). */
export type Task = z.infer<typeof taskSchema>;

/** The language-independent part of a task; the title lives in `task-titles.server.ts`. */
export type TaskRecord = Omit<Task, "title">;

export const taskRecords = [
  {
    id: "TASK-8782",
    status: "in progress",
    label: "documentation",
    priority: "medium",
  },
  {
    id: "TASK-7878",
    status: "backlog",
    label: "documentation",
    priority: "medium",
  },
  {
    id: "TASK-7839",
    status: "todo",
    label: "bug",
    priority: "high",
  },
  {
    id: "TASK-5562",
    status: "backlog",
    label: "feature",
    priority: "medium",
  },
  {
    id: "TASK-8686",
    status: "canceled",
    label: "feature",
    priority: "medium",
  },
  {
    id: "TASK-1280",
    status: "done",
    label: "bug",
    priority: "high",
  },
  {
    id: "TASK-7262",
    status: "done",
    label: "feature",
    priority: "high",
  },
  {
    id: "TASK-1138",
    status: "in progress",
    label: "feature",
    priority: "medium",
  },
  {
    id: "TASK-7184",
    status: "todo",
    label: "feature",
    priority: "low",
  },
  {
    id: "TASK-5160",
    status: "in progress",
    label: "documentation",
    priority: "high",
  },
  {
    id: "TASK-5618",
    status: "done",
    label: "documentation",
    priority: "medium",
  },
  {
    id: "TASK-6699",
    status: "backlog",
    label: "documentation",
    priority: "medium",
  },
  {
    id: "TASK-2858",
    status: "backlog",
    label: "bug",
    priority: "medium",
  },
  {
    id: "TASK-9864",
    status: "done",
    label: "bug",
    priority: "high",
  },
  {
    id: "TASK-8404",
    status: "in progress",
    label: "bug",
    priority: "low",
  },
  {
    id: "TASK-5365",
    status: "in progress",
    label: "documentation",
    priority: "low",
  },
  {
    id: "TASK-1780",
    status: "todo",
    label: "documentation",
    priority: "high",
  },
  {
    id: "TASK-6938",
    status: "todo",
    label: "documentation",
    priority: "high",
  },
  {
    id: "TASK-9885",
    status: "backlog",
    label: "bug",
    priority: "high",
  },
  {
    id: "TASK-3216",
    status: "backlog",
    label: "documentation",
    priority: "medium",
  },
  {
    id: "TASK-9285",
    status: "todo",
    label: "bug",
    priority: "high",
  },
  {
    id: "TASK-1024",
    status: "in progress",
    label: "documentation",
    priority: "low",
  },
  {
    id: "TASK-7068",
    status: "canceled",
    label: "bug",
    priority: "low",
  },
  {
    id: "TASK-6502",
    status: "todo",
    label: "bug",
    priority: "high",
  },
  {
    id: "TASK-5326",
    status: "todo",
    label: "bug",
    priority: "low",
  },
  {
    id: "TASK-6274",
    status: "canceled",
    label: "documentation",
    priority: "low",
  },
  {
    id: "TASK-1571",
    status: "in progress",
    label: "feature",
    priority: "medium",
  },
  {
    id: "TASK-9518",
    status: "canceled",
    label: "documentation",
    priority: "medium",
  },
  {
    id: "TASK-5581",
    status: "backlog",
    label: "documentation",
    priority: "high",
  },
  {
    id: "TASK-2197",
    status: "todo",
    label: "documentation",
    priority: "low",
  },
  {
    id: "TASK-8484",
    status: "in progress",
    label: "bug",
    priority: "low",
  },
  {
    id: "TASK-9892",
    status: "done",
    label: "documentation",
    priority: "high",
  },
  {
    id: "TASK-9616",
    status: "in progress",
    label: "feature",
    priority: "medium",
  },
  {
    id: "TASK-9744",
    status: "done",
    label: "documentation",
    priority: "low",
  },
  {
    id: "TASK-1376",
    status: "backlog",
    label: "documentation",
    priority: "low",
  },
  {
    id: "TASK-7382",
    status: "todo",
    label: "feature",
    priority: "low",
  },
  {
    id: "TASK-2290",
    status: "canceled",
    label: "documentation",
    priority: "high",
  },
  {
    id: "TASK-1533",
    status: "done",
    label: "bug",
    priority: "high",
  },
  {
    id: "TASK-4920",
    status: "in progress",
    label: "bug",
    priority: "high",
  },
  {
    id: "TASK-5168",
    status: "in progress",
    label: "feature",
    priority: "low",
  },
  {
    id: "TASK-7103",
    status: "canceled",
    label: "feature",
    priority: "low",
  },
  {
    id: "TASK-4314",
    status: "in progress",
    label: "bug",
    priority: "high",
  },
  {
    id: "TASK-3415",
    status: "todo",
    label: "feature",
    priority: "high",
  },
  {
    id: "TASK-8339",
    status: "in progress",
    label: "feature",
    priority: "low",
  },
  {
    id: "TASK-6995",
    status: "todo",
    label: "feature",
    priority: "high",
  },
  {
    id: "TASK-8053",
    status: "todo",
    label: "feature",
    priority: "medium",
  },
  {
    id: "TASK-4336",
    status: "todo",
    label: "documentation",
    priority: "low",
  },
  {
    id: "TASK-8790",
    status: "done",
    label: "bug",
    priority: "medium",
  },
  {
    id: "TASK-8980",
    status: "canceled",
    label: "bug",
    priority: "low",
  },
  {
    id: "TASK-7342",
    status: "backlog",
    label: "documentation",
    priority: "low",
  },
  {
    id: "TASK-5608",
    status: "canceled",
    label: "documentation",
    priority: "low",
  },
  {
    id: "TASK-1606",
    status: "done",
    label: "feature",
    priority: "medium",
  },
  {
    id: "TASK-7872",
    status: "canceled",
    label: "feature",
    priority: "medium",
  },
  {
    id: "TASK-4167",
    status: "canceled",
    label: "bug",
    priority: "medium",
  },
  {
    id: "TASK-9581",
    status: "backlog",
    label: "documentation",
    priority: "low",
  },
  {
    id: "TASK-8806",
    status: "done",
    label: "bug",
    priority: "medium",
  },
  {
    id: "TASK-6542",
    status: "done",
    label: "feature",
    priority: "low",
  },
  {
    id: "TASK-6806",
    status: "canceled",
    label: "documentation",
    priority: "low",
  },
  {
    id: "TASK-9549",
    status: "todo",
    label: "feature",
    priority: "high",
  },
  {
    id: "TASK-1075",
    status: "done",
    label: "feature",
    priority: "medium",
  },
  {
    id: "TASK-1427",
    status: "done",
    label: "documentation",
    priority: "high",
  },
  {
    id: "TASK-1907",
    status: "todo",
    label: "documentation",
    priority: "high",
  },
  {
    id: "TASK-4309",
    status: "backlog",
    label: "bug",
    priority: "medium",
  },
  {
    id: "TASK-3973",
    status: "todo",
    label: "feature",
    priority: "medium",
  },
  {
    id: "TASK-7962",
    status: "canceled",
    label: "bug",
    priority: "low",
  },
  {
    id: "TASK-3360",
    status: "done",
    label: "feature",
    priority: "medium",
  },
  {
    id: "TASK-9887",
    status: "backlog",
    label: "bug",
    priority: "medium",
  },
  {
    id: "TASK-3649",
    status: "in progress",
    label: "feature",
    priority: "medium",
  },
  {
    id: "TASK-3586",
    status: "in progress",
    label: "bug",
    priority: "low",
  },
  {
    id: "TASK-5150",
    status: "canceled",
    label: "feature",
    priority: "medium",
  },
  {
    id: "TASK-3652",
    status: "backlog",
    label: "feature",
    priority: "low",
  },
  {
    id: "TASK-6884",
    status: "canceled",
    label: "feature",
    priority: "high",
  },
  {
    id: "TASK-1591",
    status: "in progress",
    label: "feature",
    priority: "high",
  },
  {
    id: "TASK-3802",
    status: "in progress",
    label: "feature",
    priority: "low",
  },
  {
    id: "TASK-7253",
    status: "backlog",
    label: "bug",
    priority: "high",
  },
  {
    id: "TASK-9739",
    status: "done",
    label: "documentation",
    priority: "medium",
  },
  {
    id: "TASK-4424",
    status: "in progress",
    label: "documentation",
    priority: "medium",
  },
  {
    id: "TASK-3922",
    status: "backlog",
    label: "bug",
    priority: "low",
  },
  {
    id: "TASK-4921",
    status: "canceled",
    label: "bug",
    priority: "low",
  },
  {
    id: "TASK-5814",
    status: "backlog",
    label: "bug",
    priority: "high",
  },
  {
    id: "TASK-2645",
    status: "todo",
    label: "documentation",
    priority: "medium",
  },
  {
    id: "TASK-4535",
    status: "in progress",
    label: "feature",
    priority: "low",
  },
  {
    id: "TASK-4463",
    status: "done",
    label: "documentation",
    priority: "low",
  },
  {
    id: "TASK-9745",
    status: "canceled",
    label: "feature",
    priority: "high",
  },
  {
    id: "TASK-2080",
    status: "todo",
    label: "bug",
    priority: "medium",
  },
  {
    id: "TASK-3838",
    status: "backlog",
    label: "bug",
    priority: "high",
  },
  {
    id: "TASK-1340",
    status: "todo",
    label: "bug",
    priority: "medium",
  },
  {
    id: "TASK-6665",
    status: "canceled",
    label: "feature",
    priority: "low",
  },
  {
    id: "TASK-7585",
    status: "backlog",
    label: "feature",
    priority: "low",
  },
  {
    id: "TASK-6319",
    status: "backlog",
    label: "bug",
    priority: "high",
  },
  {
    id: "TASK-4369",
    status: "backlog",
    label: "bug",
    priority: "high",
  },
  {
    id: "TASK-9035",
    status: "canceled",
    label: "documentation",
    priority: "low",
  },
  {
    id: "TASK-3970",
    status: "todo",
    label: "documentation",
    priority: "medium",
  },
  {
    id: "TASK-4473",
    status: "todo",
    label: "documentation",
    priority: "low",
  },
  {
    id: "TASK-4136",
    status: "canceled",
    label: "bug",
    priority: "medium",
  },
  {
    id: "TASK-3939",
    status: "done",
    label: "feature",
    priority: "low",
  },
  {
    id: "TASK-2007",
    status: "backlog",
    label: "bug",
    priority: "high",
  },
  {
    id: "TASK-7516",
    status: "done",
    label: "documentation",
    priority: "medium",
  },
  {
    id: "TASK-6906",
    status: "done",
    label: "feature",
    priority: "high",
  },
  {
    id: "TASK-5207",
    status: "in progress",
    label: "bug",
    priority: "low",
  },
] as const satisfies readonly TaskRecord[];

export type TaskId = (typeof taskRecords)[number]["id"];

export const labels: readonly { value: TaskLabel }[] = taskLabelValues.map((value) => ({ value }));

export const statuses = [
  { value: "backlog", icon: HelpCircle },
  { value: "todo", icon: Circle },
  { value: "in progress", icon: Timer },
  { value: "done", icon: CheckCircle },
  { value: "canceled", icon: CircleOff },
] as const satisfies readonly { value: TaskStatus; icon: unknown }[];

export const priorities = [
  { value: "low", icon: ArrowDown },
  { value: "medium", icon: ArrowRight },
  { value: "high", icon: ArrowUp },
] as const satisfies readonly { value: TaskPriority; icon: unknown }[];
