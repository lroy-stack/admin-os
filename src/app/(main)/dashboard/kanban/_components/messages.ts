import { type MessageKey, messageKey, type PageMeta, type Plural } from "@/core/i18n/client";

import type { TaskFormErrors } from "./task-form";
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
    /** Placeholders: `{count}`, the filters other than the search. */
    readonly filterActive: string;
  };
  readonly filter: {
    readonly title: string;
    readonly description: string;
    readonly owner: string;
    readonly team: string;
    readonly priority: string;
    readonly dueBefore: string;
    readonly any: string;
    readonly clear: string;
    readonly noMatchTitle: string;
    readonly noMatchDescription: string;
  };
  readonly sort: {
    readonly title: string;
    readonly manual: string;
    readonly due: string;
    readonly priority: string;
    readonly name: string;
  };
  readonly task: {
    /** Placeholders: `{title}`. */
    readonly moreActions: string;
    readonly menu: {
      readonly open: string;
      readonly edit: string;
      readonly moveTo: string;
      readonly delete: string;
    };
    readonly panel: {
      /** Placeholders: `{column}`. */
      readonly description: string;
      readonly status: string;
      readonly priority: string;
      readonly team: string;
      readonly owner: string;
      readonly dueDate: string;
      readonly progress: string;
      readonly moveTo: string;
      readonly edit: string;
      readonly delete: string;
    };
    readonly form: {
      readonly createTitle: string;
      readonly createVerb: string;
      readonly editTitle: string;
      readonly editVerb: string;
      readonly description: string;
      readonly title: string;
      readonly details: string;
      readonly status: string;
      readonly team: string;
      readonly priority: string;
      readonly owner: string;
      readonly ownerPlaceholder: string;
      readonly dueDate: string;
      readonly errors: TaskFormErrors;
    };
    readonly confirm: {
      readonly title: string;
      readonly verb: string;
      /** Placeholders: `{title}`. Says the data is the demo's. */
      readonly consequence: string;
    };
    /** Each confirmation of a change a person can undo. Placeholders: `{title}`, `{column}` (moved only). */
    readonly toast: {
      readonly created: string;
      readonly saved: string;
      readonly moved: string;
      readonly deleted: string;
    };
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
    readonly menu: { readonly rename: string; readonly delete: string };
    readonly rename: {
      readonly title: string;
      readonly verb: string;
      readonly description: string;
      readonly label: string;
      readonly nameRequired: string;
    };
    readonly confirm: {
      readonly title: string;
      readonly verb: string;
      /** Placeholders: `{column}`, `{count}`. Says the data is the demo's. */
      readonly consequence: Plural;
    };
    /** Placeholders: `{column}`. */
    readonly toast: { readonly renamed: string; readonly deleted: string };
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
