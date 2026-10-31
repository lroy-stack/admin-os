export type ColumnId = "ideas" | "planned" | "building" | "qa" | "shipped";

/** A column is its id; the name shown for it comes from the dictionary. */
export type Column = {
  id: ColumnId;
};

export type TaskTeam =
  | "Backend"
  | "Data"
  | "Design"
  | "Docs"
  | "Finance Ops"
  | "Platform"
  | "Product"
  | "QA"
  | "Security";

export type TaskPriority = "High" | "Medium" | "Low";

export type TaskInsightLabel = "Attachments" | "Comments" | "Documents";

export type TaskInsight = {
  label: TaskInsightLabel;
  count: number;
};

export type TaskOwnerProfile = {
  name: string;
  tone: string;
};

export type TaskId =
  | "tender-workflow-map"
  | "license-strategy-research"
  | "backup-restore-plan"
  | "work-order-allocation-model"
  | "future-sync-notes"
  | "electron-app-shell"
  | "secure-preload-api"
  | "party-employee-records"
  | "generated-documents-index"
  | "sqlite-drizzle-schema"
  | "salary-excel-import"
  | "column-mapping-builder"
  | "salary-row-validation"
  | "payslip-preview"
  | "architecture-rule"
  | "private-mvp-scope"
  | "mvp-module-priorities";

/** The business text of a task: the only part that is written in a language. */
export type TaskText = {
  title: string;
  description: string;
};

/** What does not depend on the language. `dueDate` is a calendar day (YYYY-MM-DD). */
export type TaskFacts = {
  id: TaskId;
  priority: TaskPriority;
  dueDate: string;
  progress: number;
  owner: TaskOwnerProfile;
  team: TaskTeam;
  insights: TaskInsight[];
};

export type Task = TaskFacts & TaskText;

export type BoardLayout = Record<ColumnId, TaskFacts[]>;

export type BoardState = Record<ColumnId, Task[]>;
