import { type MessageKey, messageKey, type PageMeta } from "@/core/i18n/client";
import type { Segment } from "@/data/crm";

/** Text of /dashboard/users (Customer Directory), including the demo job titles. */
export interface CustomerDirectoryMessages {
  readonly meta: PageMeta;
  readonly title: string;
  readonly kpis: {
    readonly customers: string;
    /** Placeholders: `{count}`. */
    readonly newThisWeek: string;
    readonly contacted: string;
    readonly pipeline: string;
  };
  readonly search: { readonly label: string; readonly placeholder: string };
  readonly segmentLabel: string;
  readonly allSegments: string;
  /** Segment names, keyed by the segment ids of `@/data/crm`. */
  readonly segments: Readonly<Record<Segment, string>>;
  readonly views: { readonly label: string; readonly grid: string; readonly table: string };
  readonly sort: {
    readonly label: string;
    readonly lastContact: string;
    readonly openPipeline: string;
    readonly score: string;
    readonly name: string;
  };
  readonly export: string;
  readonly newCustomer: string;
  readonly empty: {
    readonly title: string;
    /** Placeholders: `{query}`. */
    readonly noMatch: string;
    readonly noCustomers: string;
  };
  readonly card: {
    readonly openPipeline: string;
    readonly lastContact: string;
    /** Placeholders: `{score}`. */
    readonly score: string;
    /** Placeholders: `{name}` in each of the next four. */
    readonly star: string;
    readonly unstar: string;
    readonly email: string;
    readonly call: string;
  };
  readonly table: {
    readonly customer: string;
    readonly segment: string;
    readonly openPipeline: string;
    readonly lastContact: string;
    readonly score: string;
    readonly starred: string;
  };
  /** Demo job titles, keyed by the English title in `@/data/crm`; people and companies are proper nouns. */
  readonly jobTitles: Readonly<Record<string, string>>;
}

export const customerDirectoryMessageKey: MessageKey<CustomerDirectoryMessages> =
  messageKey<CustomerDirectoryMessages>("customerDirectory");
