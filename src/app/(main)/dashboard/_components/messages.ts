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
