import { type MessageKey, messageKey, type PageMeta, type Plural } from "@/core/i18n/client";

/**
 * Text of /dashboard/productivity, including its demo tasks, projects and notes (business text).
 */
export interface ProductivityMessages {
  readonly meta: PageMeta;
  readonly greeting: {
    /** Placeholders: `{name}`. */
    readonly title: string;
    readonly subtitle: string;
  };
  readonly summary: {
    readonly today: string;
    /** Selected by the number of tasks; no placeholders. */
    readonly tasksScheduled: Plural;
    readonly thisWeek: string;
    readonly progress: string;
    readonly focus: string;
    readonly deepWork: string;
    /** Placeholders: `{count}` (hours). */
    readonly hoursRemaining: Plural;
  };
  readonly tasks: {
    readonly title: string;
    readonly empty: string;
    readonly rangeLabel: string;
    readonly ranges: { readonly today: string; readonly tomorrow: string; readonly thisWeek: string };
    readonly newTask: string;
    readonly tags: {
      readonly work: string;
      readonly design: string;
      readonly admin: string;
      readonly content: string;
      readonly planning: string;
    };
    /** Demo tasks. */
    readonly items: {
      readonly finalizeRoadmap: string;
      readonly reviewDesignSystem: string;
      readonly replyToEmails: string;
      readonly planContent: string;
      readonly prepareSyncNotes: string;
    };
  };
  readonly projects: {
    readonly title: string;
    readonly empty: string;
    readonly progress: string;
    readonly filterLabel: string;
    readonly filters: { readonly active: string; readonly planning: string; readonly completed: string };
    readonly new: string;
    /** Placeholders: `{date}`. */
    readonly due: string;
    readonly statuses: {
      readonly inProgress: string;
      readonly planning: string;
      readonly completed: string;
    };
    /** Demo projects. */
    readonly items: {
      readonly roadmap: { readonly title: string; readonly description: string };
      readonly website: { readonly title: string; readonly description: string };
      readonly onboarding: { readonly title: string; readonly description: string };
    };
  };
  readonly quickActions: {
    readonly title: string;
    readonly newNote: string;
    readonly newTask: string;
    readonly newProject: string;
    readonly newGoal: string;
  };
  readonly quote: {
    readonly title: string;
    readonly subtitle: string;
  };
  readonly focus: {
    readonly title: string;
    readonly start: string;
    readonly pause: string;
    readonly resume: string;
    readonly noNotifications: string;
  };
  readonly notes: {
    readonly title: string;
    readonly today: string;
    readonly yesterday: string;
    /** Demo notes. */
    readonly items: {
      readonly designPrinciples: string;
      /** Placeholders: `{month}`. */
      readonly contentIdeas: string;
      readonly weeklyLessons: string;
      readonly books: string;
    };
  };
  readonly week: {
    readonly title: string;
    readonly encouragement: string;
    /** Selected by the total number of goals. Placeholders: `{done}`, `{count}`. */
    readonly goals: Plural;
  };
  readonly done: string;
  /** The labels and sentence of the windows that add a task, project, note or goal. */
  readonly forms: {
    readonly required: string;
    readonly title: string;
    readonly description: string;
    readonly tag: string;
    readonly when: string;
    readonly time: string;
    readonly status: string;
    readonly due: string;
    readonly goal: string;
  };
  readonly toasts: {
    readonly task: string;
    readonly project: string;
    readonly note: string;
    readonly goal: string;
  };
}

export const productivityMessageKey: MessageKey<ProductivityMessages> =
  messageKey<ProductivityMessages>("productivity");
