import type { PageMeta, Plural } from "@/core/i18n/client";

/**
 * Text of /dashboard/productivity, including its demo tasks, projects and notes (business text).
 * Every consumer is a Server Component (the one client piece gets resolved props), so there is no `messageKey`.
 */
export interface ProductivityMessages {
  readonly viewAll: string;
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
    readonly filterLabel: string;
    readonly filters: { readonly active: string; readonly planning: string; readonly completed: string };
    readonly new: string;
    /** Placeholders: `{date}`. */
    readonly due: string;
    readonly statuses: { readonly inProgress: string; readonly planning: string };
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
    readonly upload: string;
  };
  readonly quote: {
    readonly title: string;
    readonly subtitle: string;
  };
  readonly focus: {
    readonly title: string;
    readonly start: string;
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
}
