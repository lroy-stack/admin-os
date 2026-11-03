import { type MessageKey, messageKey, type PageMeta } from "@/core/i18n/client";

/**
 * Text of /dashboard/customers (the customers directory). The page title and the nav label come from the preset
 * vocabulary (`customers.title`: guests, clients…), so the strings here say "contact" where a noun is needed.
 */
export interface CustomerDirectoryMessages {
  readonly meta: PageMeta;
  readonly search: { readonly label: string; readonly placeholder: string };
  readonly statusLabel: string;
  readonly status: { readonly all: string; readonly vip: string; readonly blocked: string };
  readonly views: { readonly label: string; readonly grid: string; readonly table: string };
  readonly sort: {
    readonly label: string;
    readonly name: string;
    readonly lastVisit: string;
    readonly visits: string;
    readonly spend: string;
  };
  readonly export: string;
  readonly empty: {
    readonly noContactsTitle: string;
    readonly noContacts: string;
    readonly noMatchTitle: string;
    /** Placeholders: `{query}`. */
    readonly noMatch: string;
    readonly noMatchFilter: string;
  };
  readonly card: {
    readonly visits: string;
    readonly spend: string;
    readonly lastVisit: string;
    readonly never: string;
    readonly vip: string;
    readonly blocked: string;
    /** Placeholders: `{name}` in each of the next two. */
    readonly email: string;
    readonly call: string;
  };
  readonly table: {
    readonly customer: string;
    readonly visits: string;
    readonly spend: string;
    readonly lastVisit: string;
    readonly contact: string;
  };
  /** Column headers of the exported file, and the words it uses for yes and no. */
  readonly csv: {
    readonly name: string;
    readonly email: string;
    readonly phone: string;
    readonly tags: string;
    readonly vip: string;
    readonly blocked: string;
    readonly visits: string;
    readonly spend: string;
    readonly currency: string;
    readonly lastVisit: string;
    readonly yes: string;
    readonly no: string;
  };
  readonly pager: { readonly label: string; readonly next: string; readonly first: string };
}

export const customerDirectoryMessageKey: MessageKey<CustomerDirectoryMessages> =
  messageKey<CustomerDirectoryMessages>("customerDirectory");
