import { type MessageKey, messageKey, type PageMeta, type Plural } from "@/core/i18n/client";

import type { TaskLabel, TaskPriority, TaskStatus } from "./data";

/** Text of /dashboard/tasks. The demo task titles are in `task-titles.server.ts`. */
export interface TasksMessages {
  readonly meta: PageMeta;
  readonly welcome: {
    readonly title: string;
    readonly subtitle: string;
  };
  readonly statuses: Readonly<Record<TaskStatus, string>>;
  readonly priorities: Readonly<Record<TaskPriority, string>>;
  readonly labels: Readonly<Record<TaskLabel, string>>;
  readonly columns: {
    readonly task: string;
    readonly title: string;
    readonly status: string;
    readonly priority: string;
  };
  readonly sort: {
    readonly ascending: string;
    readonly descending: string;
    readonly reset: string;
  };
  readonly row: {
    readonly selectAll: string;
    readonly selectRow: string;
    readonly openMenu: string;
    readonly edit: string;
    readonly copy: string;
    readonly favorite: string;
    readonly labels: string;
    readonly delete: string;
    /** The keyboard shortcut hint: symbols, the same in every language. */
    readonly deleteShortcut: string;
  };
  readonly toolbar: {
    readonly filterPlaceholder: string;
    readonly status: string;
    readonly priority: string;
    readonly clearFilters: string;
    readonly reset: string;
    readonly view: string;
    readonly toggleColumns: string;
  };
  readonly table: {
    readonly empty: string;
    /** Placeholders: `{count}` (selected rows), `{total}` (rows after filtering). */
    readonly selected: Plural;
    readonly rowsPerPage: string;
    /** Placeholders: `{page}`, `{pages}`. */
    readonly pageOf: string;
    readonly pagination: string;
    readonly firstPage: string;
    readonly previousPage: string;
    readonly nextPage: string;
    readonly lastPage: string;
    /** The visible text of the previous and next links. */
    readonly previous: string;
    readonly next: string;
  };
}

export const tasksMessageKey: MessageKey<TasksMessages> = messageKey<TasksMessages>("tasks");
