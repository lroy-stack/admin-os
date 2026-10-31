import { type MessageKey, messageKey, type PageMeta, type Plural } from "@/core/i18n/client";

/** Text of /dashboard/default (Sales Overview). */
export interface OverviewMessages {
  readonly meta: PageMeta;
  readonly title: string;
  readonly kpis: {
    readonly won: string;
    /** Placeholders: `{change}`, the signed percentage. */
    readonly versusLastMonth: string;
    readonly pipeline: string;
    readonly winRate: string;
  };
  readonly revenue: {
    readonly title: string;
    readonly rangeLabel: string;
    readonly ranges: { readonly sixMonths: string; readonly twelveMonths: string };
    readonly options: string;
    readonly openReports: string;
    /** Placeholders: `{count}` (months shown), `{atTarget}`. */
    readonly summary: Plural;
    /** The series name, in the legend and the tooltip. */
    readonly won: string;
    /** Placeholders: `{amount}`. */
    readonly target: string;
  };
  readonly quota: {
    readonly title: string;
    readonly options: string;
    readonly attainment: string;
    /** Placeholders: `{won}`, `{target}`. */
    readonly summary: string;
  };
  readonly stageMix: {
    readonly title: string;
    readonly openPipeline: string;
    /** Placeholders: `{count}` (deals). */
    readonly openAcross: Plural;
    readonly chartLabel: string;
  };
  readonly hotDeals: {
    readonly title: string;
    readonly byWeightedValue: string;
    readonly addDeal: string;
    readonly openPipeline: string;
  };
}

export const overviewMessageKey: MessageKey<OverviewMessages> = messageKey<OverviewMessages>("overview");
