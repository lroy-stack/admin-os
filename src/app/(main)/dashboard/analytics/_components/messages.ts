import { type MessageKey, messageKey, type PageMeta, type Plural } from "@/core/i18n/client";
import type { LeadChannel } from "@/data/crm";

/** Text of /dashboard/analytics (Growth Reports). */
export interface GrowthMessages {
  readonly meta: PageMeta;
  readonly title: string;
  readonly periodLabel: string;
  readonly periods: { readonly threeMonths: string; readonly sixMonths: string; readonly twelveMonths: string };
  readonly exportCsv: string;
  readonly month: string;
  readonly openCustomers: string;
  readonly openPipeline: string;
  readonly kpis: {
    /** Placeholders: `{count}` (months in the period). */
    readonly newCustomers: string;
    readonly averageWonDeal: string;
    readonly salesCycle: string;
  };
  /** Segment names, keyed like the series of the revenue chart. */
  readonly segments: { readonly enterprise: string; readonly midMarket: string; readonly smb: string };
  /** Channel names, keyed by the channel ids of `@/data/crm`. */
  readonly channels: Readonly<Record<LeadChannel, string>>;
  readonly revenueBySegment: {
    readonly title: string;
    readonly unitLabel: string;
    /** Placeholders: `{count}` (months in the period). */
    readonly wonSummary: string;
  };
  readonly leadSources: {
    readonly title: string;
    /** Placeholders: `{count}` (customers who joined), `{months}`. */
    readonly intro: Plural;
    /** Placeholders: `{count}`. */
    readonly centerLabel: Plural;
  };
  readonly newCustomers: {
    readonly title: string;
    readonly series: string;
  };
  readonly winRate: {
    readonly title: string;
    readonly series: string;
    readonly average: string;
    /** Placeholders: `{rate}`, the formatted percentage. */
    readonly tooltip: string;
  };
}

export const growthMessageKey: MessageKey<GrowthMessages> = messageKey<GrowthMessages>("growth");
