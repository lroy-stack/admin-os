import { type MessageKey, messageKey, type PageMeta, type Plural } from "@/core/i18n/client";

/** Text of /dashboard/ecommerce (Store Overview), including the demo products, categories and review. */
export interface EcommerceMessages {
  readonly meta: PageMeta;
  readonly title: string;
  readonly filters: {
    readonly periodLabel: string;
    readonly period: {
      readonly thisMonth: string;
      readonly lastMonth: string;
      readonly last30Days: string;
      readonly yearToDate: string;
    };
    readonly channelLabel: string;
    readonly channel: {
      readonly all: string;
      readonly onlineStore: string;
      readonly marketplace: string;
      readonly social: string;
      readonly retail: string;
    };
    /** The line under the title: the period and channel on show. Placeholders: `{period}`, `{channel}`. */
    readonly showing: string;
  };
  readonly kpis: {
    readonly totalSales: string;
    readonly totalOrders: string;
    readonly customerGrowth: string;
    readonly averageOrder: string;
    readonly returnRequests: string;
    readonly stockAccuracy: string;
    readonly vsLastWeek: string;
    readonly vsLastMonth: string;
    readonly vsLastAudit: string;
    /** Percentage points. Placeholders: `{value}`, the signed number. */
    readonly points: string;
    readonly salesOverview: string;
    readonly revenue: string;
    readonly profit: string;
    /** The tooltip's date range. Placeholders: `{start}`, `{end}`. */
    readonly dateRange: string;
  };
  readonly traffic: {
    readonly title: string;
    /** Placeholders: `{count}` (selects the form), `{value}` (the compact figure). */
    readonly visits: Plural;
    readonly visitors: string;
    readonly anomalies: string;
    readonly hoursAgo: string;
    readonly now: string;
  };
  readonly sources: {
    readonly title: string;
    /** Placeholders: `{count}` (selects the form), `{value}` (the compact figure). */
    readonly visits: Plural;
    readonly visitsSeries: string;
    /** When the selected channel brings no traffic. */
    readonly empty: string;
  };
  readonly topProducts: {
    readonly title: string;
    /** Placeholders: `{percent}`. */
    readonly ofSales: string;
    readonly chartLabel: string;
    readonly products: string;
    readonly share: string;
    readonly sales: string;
    readonly categories: {
      readonly apparel: string;
      readonly accessories: string;
      readonly home: string;
    };
    readonly items: {
      readonly linenOvershirt: string;
      readonly everydayTote: string;
      readonly ceramicPlanter: string;
    };
  };
  readonly inventory: {
    readonly title: string;
    /** Placeholders: `{percent}`. */
    readonly available: string;
    readonly availableLabel: string;
    readonly inStock: string;
    readonly lowStock: string;
    readonly outOfStock: string;
    /** The short form under the gauge. */
    readonly out: string;
  };
  readonly reviews: {
    readonly title: string;
    /** Placeholders: `{rating}`. */
    readonly averageRating: string;
    /** Placeholders: `{rating}`. */
    readonly stars: string;
    readonly previous: string;
    readonly next: string;
    /** The featured review's text (demo content). */
    readonly quote: string;
    readonly quoteSecond: string;
    readonly quoteThird: string;
    /** Placeholders: `{count}` (selects the form), `{value}` (the compact figure). */
    readonly count: Plural;
    readonly thisMonth: string;
    /** The avatar stack's overflow. Placeholders: `{count}`. */
    readonly moreReviewers: string;
  };
  readonly orders: {
    readonly title: string;
    readonly filters: {
      readonly all: string;
      readonly needsAction: string;
      readonly unfulfilled: string;
      readonly unpaid: string;
      readonly returns: string;
    };
    /** Header summaries. Placeholders: `{count}`. */
    readonly counts: {
      readonly all: Plural;
      readonly needsAction: Plural;
      readonly unfulfilled: Plural;
      readonly unpaid: Plural;
      readonly returns: Plural;
    };
    readonly downloadOrders: string;
    readonly sortByDate: string;
    readonly empty: string;
    /** Placeholders: `{count}` (total, selects the form), `{visible}`, `{total}`. */
    readonly viewing: Plural;
    readonly pagination: {
      readonly label: string;
      readonly previous: string;
      readonly next: string;
      readonly goToPrevious: string;
      readonly goToNext: string;
    };
    readonly columns: {
      readonly order: string;
      readonly customer: string;
      readonly status: string;
      readonly total: string;
      readonly date: string;
      readonly actions: string;
    };
    /** Placeholders: `{count}`. */
    readonly items: Plural;
    readonly paymentLabel: string;
    readonly fulfillmentLabel: string;
    readonly itemsLabel: string;
    readonly panel: {
      /** Placeholders: `{id}`. */
      readonly title: string;
      /** Placeholders: `{customer}`, `{date}`. */
      readonly description: string;
      readonly channel: string;
    };
    readonly payment: { readonly paid: string; readonly pending: string; readonly refunded: string };
    readonly fulfillment: { readonly fulfilled: string; readonly unfulfilled: string; readonly returned: string };
    readonly menu: {
      readonly open: string;
      readonly label: string;
      readonly view: string;
      readonly contact: string;
      readonly copyId: string;
    };
  };
}

export const ecommerceMessageKey: MessageKey<EcommerceMessages> = messageKey<EcommerceMessages>("ecommerce");
