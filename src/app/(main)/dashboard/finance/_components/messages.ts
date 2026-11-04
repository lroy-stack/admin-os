import { type MessageKey, messageKey, type PageMeta, type Plural } from "@/core/i18n/client";

/** Text of /dashboard/finance (Personal finances). Amounts are in the business currency and never typed here. */
export interface FinanceMessages {
  readonly meta: PageMeta;
  readonly header: {
    readonly title: string;
    /** Placeholders: `{time}`, a relative time such as "5 minutes ago". */
    readonly updated: string;
    readonly export: string;
  };
  readonly tabs: { readonly dashboard: string; readonly transactions: string };
  readonly kpis: {
    readonly netWorth: string;
    /** Placeholders: `{amount}`. */
    readonly netWorthChange: string;
    readonly availableCash: string;
    /** Placeholders: `{amount}`, `{days}`. */
    readonly availableCashChange: string;
    readonly monthlySpend: string;
    /** Placeholders: `{amount}`. */
    readonly monthlySpendChange: string;
    readonly savingsRate: string;
    /** Placeholders: `{percent}`. */
    readonly savingsRateChange: string;
  };
  readonly income: {
    readonly title: string;
    /** Placeholders: `{source}`, `{percent}`. */
    readonly share: string;
    readonly sources: { readonly salary: string; readonly freelance: string; readonly investments: string };
  };
  readonly notification: {
    readonly title: string;
    /** Placeholders: `{count}` (points gained), `{score}`. */
    readonly description: Plural;
    readonly action: string;
  };
  readonly spending: {
    readonly title: string;
    readonly periodLabel: string;
    readonly periods: { readonly weekly: string; readonly monthly: string; readonly yearly: string };
    readonly expense: string;
    readonly income: string;
  };
  readonly allocation: {
    readonly title: string;
    readonly balance: string;
    readonly total: string;
    readonly accounts: {
      readonly main: string;
      readonly savings: string;
      readonly investment: string;
      readonly reserve: string;
    };
  };
  readonly wallet: {
    readonly title: string;
    /** Ends with the colon (French puts a no-break space before it). */
    readonly physicalVault: string;
    readonly airGapped: string;
    /** Placeholders: `{quantity}`, `{ticker}`. */
    readonly quantity: string;
  };
  readonly upcoming: {
    readonly title: string;
    /** Placeholders: `{count}`. */
    readonly billsDue: Plural;
    /** Placeholders: `{amount}`. */
    readonly autopay: string;
    /** Placeholders: `{time}`, `{date}`. */
    readonly when: string;
    readonly items: { readonly claude: string; readonly resend: string; readonly linear: string };
  };
  readonly quick: {
    readonly transferTitle: string;
    readonly amountLabel: string;
    readonly send: string;
    readonly shortcutsTitle: string;
    readonly shortcuts: {
      readonly payBills: string;
      readonly history: string;
    };
  };
  readonly cancel: string;
  readonly done: string;
  readonly transactions: {
    readonly caption: string;
    readonly date: string;
    readonly type: string;
    readonly amount: string;
  };
  readonly scoreHistory: { readonly title: string; readonly description: string };
  readonly bill: {
    readonly amount: string;
    readonly due: string;
    readonly autopay: string;
    /** Placeholders: `{title}`. */
    readonly open: string;
  };
  /** The quick transfer's review window. It never moves money. */
  readonly transfer: {
    readonly invalid: string;
    readonly title: string;
    readonly description: string;
    readonly amount: string;
    readonly confirm: string;
    readonly doneTitle: string;
    readonly doneBody: string;
  };
}

export const financeMessageKey: MessageKey<FinanceMessages> = messageKey<FinanceMessages>("finance");
