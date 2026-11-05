import { type MessageKey, messageKey, type PageMeta } from "@/core/i18n/client";

/** Text of /dashboard/parties (the fiscal directory of clients and suppliers). The page title is the module's `parties.title`. */
export interface PartyDirectoryMessages {
  readonly meta: PageMeta;
  readonly search: { readonly label: string; readonly placeholder: string };
  readonly roleLabel: string;
  readonly role: { readonly all: string; readonly client: string; readonly supplier: string };
  /** One party's role, singular: the pills and the roles field. */
  readonly roleName: { readonly client: string; readonly supplier: string };
  readonly kind: { readonly person: string; readonly company: string };
  readonly empty: {
    readonly title: string;
    readonly description: string;
    readonly noMatchTitle: string;
    /** Placeholders: `{query}`. */
    readonly noMatch: string;
    readonly noMatchFilter: string;
  };
  readonly card: { readonly taxId: string };
  readonly panel: {
    readonly taxId: string;
    readonly roles: string;
    readonly address: string;
    readonly country: string;
    readonly email: string;
    readonly phone: string;
    readonly notes: string;
    readonly edit: string;
  };
  readonly create: {
    /** The verb: names the opener, the window and its primary button (ADR 0015). */
    readonly verb: string;
    readonly description: string;
    /** Placeholders: `{name}`. */
    readonly done: string;
  };
  readonly edit: {
    readonly title: string;
    readonly verb: string;
    readonly description: string;
    /** Placeholders: `{name}`. */
    readonly done: string;
  };
  readonly form: {
    readonly kind: string;
    readonly legalName: string;
    readonly tradeName: string;
    readonly taxId: string;
    readonly address: string;
    readonly addressHint: string;
    readonly countryCode: string;
    readonly countryHint: string;
    readonly email: string;
    readonly phone: string;
    readonly phoneHint: string;
    readonly roles: string;
    readonly notes: string;
    /** One sentence per field, shown when its value does not pass the create schema. */
    readonly invalid: {
      readonly legalName: string;
      readonly taxId: string;
      readonly address: string;
      readonly countryCode: string;
      readonly email: string;
      readonly phone: string;
      readonly roles: string;
    };
  };
  readonly pager: { readonly label: string; readonly next: string; readonly first: string };
}

export const partyDirectoryMessageKey: MessageKey<PartyDirectoryMessages> =
  messageKey<PartyDirectoryMessages>("partyDirectory");
