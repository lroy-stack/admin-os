import type { Message, PageMeta } from "@/core/i18n/client";

/**
 * Text of /dashboard/customers/[id] (a customer's record page, ADR 0020). Words the directory already owns (visits,
 * spend, last visit, VIP, blocked) come from its dictionary; the page title is the customer's name, and the trail's
 * list level is the preset's word for its customers.
 */
export interface CustomerRecordMessages {
  /** The fallback title, used when the customer cannot be read. */
  readonly meta: PageMeta;
  readonly breadcrumb: { readonly label: string };
  readonly tabs: { readonly overview: string; readonly notes: string; readonly contact: string };
  readonly common: { readonly yes: string; readonly no: string; readonly notGiven: string };
  readonly header: {
    /** Placeholders: `{kept}` and `{count}` (the booked visits, which picks the plural). */
    readonly attendance: Message;
    /** Placeholders: `{reason}`. */
    readonly blockedReason: string;
  };
  readonly overview: {
    readonly noShows: string;
    readonly preferences: string;
    readonly marketing: string;
    readonly language: string;
  };
  readonly state: {
    readonly title: string;
    readonly active: string;
  };
  readonly notes: {
    readonly emptyTitle: string;
    readonly emptyDescription: string;
    /** Placeholders: `{name}` (the author) and `{when}` (date and time). */
    readonly byline: string;
  };
  readonly contact: {
    readonly name: string;
    readonly email: string;
    readonly phone: string;
    readonly language: string;
  };
}
