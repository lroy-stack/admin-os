import { type MessageKey, messageKey, type PageMeta, type Plural } from "@/core/i18n/client";

import type { ColumnId, TaskId, TaskInsightLabel, TaskPriority, TaskTeam, TaskText } from "./types";

/** Text of /dashboard/kanban: the board, list and table views, and the demo tasks' titles and descriptions. */
export interface KanbanMessages {
  readonly meta: PageMeta;
  readonly views: { readonly board: string; readonly list: string; readonly table: string };
  readonly toolbar: {
    readonly searchLabel: string;
    readonly searchPlaceholder: string;
    readonly filter: string;
    readonly sort: string;
    readonly addTask: string;
    readonly addMenu: string;
    readonly importCsv: string;
    readonly addFromTemplate: string;
    readonly createAutomation: string;
  };
  /** The column (status) names, keyed by the stable column ids. */
  readonly columns: Readonly<Record<ColumnId, string>>;
  readonly priorities: Readonly<Record<TaskPriority, string>>;
  readonly teams: Readonly<Record<TaskTeam, string>>;
  /** Placeholders: `{count}`. Tooltips and screen-reader text of the comment, attachment and document counters. */
  readonly insights: Readonly<Record<TaskInsightLabel, Plural>>;
  readonly column: {
    /** Placeholders: `{column}`. */
    readonly drag: string;
    /** Placeholders: `{column}`. */
    readonly addTask: string;
    /** Placeholders: `{column}`. */
    readonly actions: string;
    /** Placeholders: `{count}`. */
    readonly taskCount: Plural;
  };
  readonly card: {
    readonly progress: string;
    readonly owner: string;
    readonly dueDate: string;
    readonly team: string;
    readonly done: string;
  };
  readonly list: {
    /** The unit read after the visible count of a group; no number in it. */
    readonly taskUnit: Plural;
    /** Placeholders: `{count}`. */
    readonly highPriority: string;
    /** Placeholders: `{column}`. */
    readonly groupActions: string;
    /** Placeholders: `{column}`. */
    readonly tasksOf: string;
    readonly noTasks: string;
    /** Placeholders: `{priority}`. */
    readonly priorityOf: string;
    /** Placeholders: `{date}`. */
    readonly due: string;
    /** Placeholders: `{name}`. */
    readonly assignedTo: string;
  };
  readonly table: {
    readonly label: string;
    readonly headers: {
      readonly task: string;
      readonly status: string;
      readonly priority: string;
      readonly team: string;
      readonly owner: string;
      readonly dueDate: string;
    };
    /** Placeholders: `{title}`. */
    readonly changeStatus: string;
    /** Placeholders: `{title}`. */
    readonly dragTask: string;
    readonly emptyTitle: string;
    readonly emptyDescription: string;
    /** Placeholders: `{from}`, `{to}`, `{count}` (all tasks). */
    readonly range: Plural;
    readonly rowsPerPage: string;
    /** Placeholders: `{page}`, `{pages}`. */
    readonly page: string;
    readonly previousPage: string;
    readonly nextPage: string;
  };
  /** Demo content: what a business would write in its own language. */
  readonly tasks: Readonly<Record<TaskId, TaskText>>;
}

export const kanbanMessageKey: MessageKey<KanbanMessages> = messageKey<KanbanMessages>("kanban");
