import { type Message, type MessageKey, messageKey, type PageMeta } from "@/core/i18n/client";

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
  /** The window of each write. Each `verb` names its window and its button and repeats on the header control (ADR 0015). */
  readonly edit: { readonly verb: string; readonly description: string; readonly saved: string };
  readonly note: {
    readonly verb: string;
    readonly description: string;
    readonly label: string;
    readonly invalid: string;
    readonly saved: string;
  };
  readonly block: {
    /** The window's title, which names the object; the button repeats `verb`. */
    readonly title: string;
    readonly verb: string;
    readonly description: string;
    readonly label: string;
    readonly invalid: string;
    /** Placeholders: `{name}`. */
    readonly done: string;
  };
  readonly unblock: {
    readonly verb: string;
    /** Placeholders: `{name}` and `{reason}` (the block that Undo restores). */
    readonly done: string;
    /** When the block had no reason to restore, so the toast offers no Undo. Placeholders: `{name}`. */
    readonly doneFinal: string;
    readonly failed: string;
  };
}

export const customerRecordMessageKey: MessageKey<CustomerRecordMessages> =
  messageKey<CustomerRecordMessages>("customerRecord");
