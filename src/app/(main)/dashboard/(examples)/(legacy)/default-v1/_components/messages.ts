import { type MessageKey, messageKey, type PageMeta, type Plural } from "@/core/i18n/client";

import type { SectionStatus, SectionType } from "./proposal-sections-table/schema";

/** One KPI card: the label, the trend line (with a trend icon) and the muted caption below it. */
interface CardMessages {
  readonly label: string;
  readonly trend: string;
  readonly caption: string;
}

/** Text of /dashboard/default-v1 (legacy), including the proposal sections table. Section names are in `section-headers.server.ts`. */
export interface DefaultV1Messages {
  readonly meta: PageMeta;
  readonly cards: {
    readonly totalRevenue: Omit<CardMessages, "caption"> & {
      /** Placeholders: `{count}` (months). */
      readonly caption: Plural;
    };
    /** `trend` placeholders: `{change}`, the percentage. */
    readonly newCustomers: CardMessages;
    readonly activeAccounts: CardMessages;
    readonly growthRate: CardMessages;
  };
  readonly chart: {
    readonly title: string;
    /** Placeholders: `{count}` (months). */
    readonly totalForMonths: Plural;
    readonly lastMonths: Plural;
    /** Placeholders: `{count}` (days). */
    readonly lastDays: Plural;
    readonly rangeLabel: string;
    readonly series: {
      readonly visitors: string;
      readonly desktop: string;
      readonly mobile: string;
    };
  };
  readonly table: {
    readonly views: {
      readonly outline: string;
      readonly pastPerformance: string;
      readonly keyPersonnel: string;
      readonly focusDocuments: string;
    };
    readonly viewLabel: string;
    readonly selectView: string;
    readonly view: string;
    readonly toggleColumns: string;
    readonly addSection: string;
    readonly columns: {
      readonly header: string;
      readonly type: string;
      readonly status: string;
      readonly target: string;
      readonly limit: string;
      readonly reviewer: string;
    };
    readonly types: Readonly<Record<SectionType, string>>;
    readonly statuses: Readonly<Record<SectionStatus, string>>;
    readonly assignReviewer: string;
    readonly dragToReorder: string;
    readonly openMenu: string;
    readonly actions: {
      readonly edit: string;
      readonly copy: string;
      readonly favorite: string;
      readonly delete: string;
    };
    readonly selectAll: string;
    readonly selectRow: string;
    readonly empty: string;
    /** Placeholders: `{count}` (selected rows), `{total}` (rows after filtering). */
    readonly selected: Plural;
    readonly rowsPerPage: string;
    /** Placeholders: `{page}`, `{pages}`. */
    readonly pageOf: string;
    readonly firstPage: string;
    readonly previousPage: string;
    readonly nextPage: string;
    readonly lastPage: string;
    readonly toast: {
      /** Placeholders: `{header}`. */
      readonly saving: string;
      readonly saved: string;
      readonly error: string;
    };
    readonly drawer: {
      /** Placeholders: `{count}` (months). */
      readonly description: Plural;
      /** Placeholders: `{change}`, the percentage. */
      readonly trend: string;
      /** Placeholders: `{count}` (months). */
      readonly summary: Plural;
      readonly fields: {
        readonly header: string;
        readonly type: string;
        readonly status: string;
        readonly target: string;
        readonly limit: string;
        readonly reviewer: string;
      };
      readonly selectType: string;
      readonly selectStatus: string;
      readonly selectReviewer: string;
      readonly save: string;
      readonly close: string;
    };
  };
}

export const defaultV1MessageKey: MessageKey<DefaultV1Messages> = messageKey<DefaultV1Messages>("defaultV1");
