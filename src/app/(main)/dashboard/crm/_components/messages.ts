import { type MessageKey, messageKey, type PageMeta, type Plural } from "@/core/i18n/client";

/** Text of /dashboard/crm (Deal Pipeline). Stage names live in the shared dashboard dictionary. */
export interface CrmMessages {
  readonly meta: PageMeta;
  readonly title: string;
  readonly kpis: {
    readonly openPipeline: string;
    readonly weightedForecast: string;
    readonly closingSoon: string;
  };
  readonly searchLabel: string;
  readonly searchPlaceholder: string;
  readonly ownerFilter: string;
  readonly view: {
    readonly label: string;
    readonly board: string;
    readonly list: string;
  };
  readonly exportDeals: string;
  readonly newDeal: string;
  readonly noMatches: string;
  readonly table: {
    readonly deal: string;
    readonly stage: string;
    readonly closes: string;
    readonly owners: string;
    readonly value: string;
  };
  /** Placeholders: `{stage}`. */
  readonly addToStage: string;
  readonly outcomes: {
    readonly label: string;
    readonly won: string;
    readonly lost: string;
    /** Placeholders: `{count}`. */
    readonly wonDetail: Plural;
    /** Placeholders: `{count}`. */
    readonly lostDetail: Plural;
  };
}

export const crmMessageKey: MessageKey<CrmMessages> = messageKey<CrmMessages>("crm");
