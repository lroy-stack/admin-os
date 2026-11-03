import { type MessageKey, messageKey } from "@/core/i18n/client";

/** Text of the pieces shared by several dashboard screens: the deal card, the standalone button and CRM stage names. */
export interface DashboardMessages {
  readonly openStandalone: string;
  readonly deal: {
    /** Placeholders: `{date}`. */
    readonly closes: string;
    /** Placeholders: `{title}`. */
    readonly moreActions: string;
    /** Placeholders: `{stage}`, `{probability}`. */
    readonly stageProbability: string;
    readonly menu: {
      readonly edit: string;
      readonly moveTo: string;
      readonly markWon: string;
      readonly markLost: string;
      readonly delete: string;
    };
    /** Each confirmation of a change a person can undo. Placeholders: `{title}`, `{stage}` (moved only). */
    readonly toast: {
      readonly moved: string;
      readonly won: string;
      readonly lost: string;
      readonly deleted: string;
      readonly created: string;
      readonly saved: string;
    };
    readonly confirm: {
      readonly title: string;
      readonly verb: string;
      /** Placeholders: `{title}`. Says the data is the demo's. */
      readonly consequence: string;
    };
    readonly panel: {
      /** Placeholders: `{company}`. */
      readonly description: string;
      readonly customer: string;
      readonly stage: string;
      readonly closes: string;
      readonly value: string;
      readonly weighted: string;
      readonly owners: string;
      readonly edit: string;
    };
    readonly form: {
      readonly createTitle: string;
      readonly createVerb: string;
      readonly editTitle: string;
      readonly editVerb: string;
      readonly description: string;
      readonly title: string;
      readonly customer: string;
      readonly customerPlaceholder: string;
      readonly value: string;
      /** Placeholders: `{amount}`, the value as the business currency writes it. */
      readonly valuePreview: string;
      readonly stage: string;
      readonly closeDate: string;
      readonly owners: string;
      readonly errors: {
        readonly titleRequired: string;
        readonly customerRequired: string;
        readonly valueInvalid: string;
        readonly stageInvalid: string;
        readonly closeDateInvalid: string;
        readonly ownersRequired: string;
      };
    };
  };
  /** Names of the pipeline stages, keyed by the stage ids of `@/data/crm`. */
  readonly stages: {
    readonly qualification: string;
    readonly proposal: string;
    readonly negotiation: string;
    readonly closing: string;
    readonly won: string;
    readonly lost: string;
  };
}

export const dashboardMessageKey: MessageKey<DashboardMessages> = messageKey<DashboardMessages>("dashboard");
