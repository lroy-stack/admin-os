import { type MessageKey, messageKey, type PageMeta, type Plural } from "@/core/i18n/client";

export type SpendingCategory =
  | "housing"
  | "utilities"
  | "groceries"
  | "transportation"
  | "subscriptions"
  | "healthcare"
  | "other";

/** Text of /dashboard/finance-v1 (the legacy finance overview). Amounts are in the business currency. */
export interface FinanceV1Messages {
  readonly meta: PageMeta;
  readonly tabs: {
    readonly overview: string;
    readonly activity: string;
    readonly insights: string;
    readonly utilities: string;
  };
  readonly kpis: {
    /** Placeholders: `{change}`, a signed amount or percentage. */
    readonly versusLastMonth: string;
    readonly primaryAccount: {
      readonly title: string;
      readonly balance: string;
      readonly pay: string;
      readonly request: string;
    };
    readonly netWorth: { readonly title: string; readonly period: string; readonly scope: string };
    readonly monthlyCashFlow: { readonly title: string; readonly period: string };
    readonly savingsRate: { readonly title: string; readonly period: string; readonly note: string };
  };
  readonly cashFlow: {
    readonly title: string;
    readonly description: string;
    readonly periodPlaceholder: string;
    readonly periods: {
      readonly thisMonth: string;
      readonly lastSixMonths: string;
      readonly yearToDate: string;
      readonly thisYear: string;
    };
    readonly income: string;
    readonly expenses: string;
  };
  readonly spending: {
    readonly title: string;
    readonly description: string;
    /** Placeholders: `{category}`, `{amount}`. */
    readonly segment: string;
    readonly categories: Readonly<Record<SpendingCategory, string>>;
  };
  readonly reliability: {
    readonly title: string;
    readonly description: string;
    readonly level: string;
    /** Placeholders: `{count}` (months). */
    readonly basis: Plural;
    readonly fixed: { readonly title: string; readonly description: string };
    readonly variable: { readonly title: string; readonly description: string };
    /** Ends with the colon (French puts a no-break space before it). */
    readonly trend: string;
    readonly stable: string;
  };
  readonly card: {
    readonly title: string;
    /** Placeholders: `{added}`, `{total}`. */
    readonly description: string;
    readonly validThru: string;
    readonly cvv: string;
    readonly type: string;
    readonly virtual: string;
    readonly billingCycle: string;
    /** Placeholders: `{day}`. */
    readonly billingDay: string;
    readonly limit: string;
    readonly availableBalance: string;
    readonly manage: string;
    readonly add: string;
    readonly upcomingPayments: string;
    readonly viewAll: string;
    /** Placeholders: `{date}`. */
    readonly dueOn: string;
    readonly payments: {
      readonly rent: string;
      readonly electricity: string;
      readonly chatgpt: string;
      readonly creditCard: string;
    };
  };
}

export const financeV1MessageKey: MessageKey<FinanceV1Messages> = messageKey<FinanceV1Messages>("financeV1");
