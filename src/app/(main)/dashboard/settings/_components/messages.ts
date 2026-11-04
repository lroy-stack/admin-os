import { type MessageKey, messageKey, type PageMeta, type Plural } from "@/core/i18n/client";

interface Section {
  readonly title: string;
  readonly description: string;
}

/** Text of /dashboard/settings, the business settings (spec 008). The values are the business's own, never translated. */
export interface BusinessSettingsMessages {
  readonly meta: PageMeta;
  /** The page heading: one word, as every screen's (`PageHeader`); the tab and the account menu say "business". */
  readonly title: string;
  readonly edit: string;
  /** Shown for a detail the business has not filled in. */
  readonly notSet: string;
  /** Under the sections, for a role that cannot change them. */
  readonly ownerOnly: string;
  readonly sections: { readonly profile: Section; readonly payment: Section; readonly invoicing: Section };
  readonly fields: {
    readonly tradeName: string;
    readonly legalName: string;
    readonly taxId: string;
    readonly email: string;
    readonly phone: string;
    readonly website: string;
    readonly address: string;
    /** Under the address field: one line per row, up to `{max}`. */
    readonly addressHint: string;
    readonly accountHolder: string;
    readonly accountNumber: string;
    readonly bank: string;
    readonly defaultTax: string;
    /** Placeholders: `{tax}`, the tax's name. */
    readonly rate: string;
    readonly paymentTerms: string;
    readonly paymentTermsHint: string;
  };
  readonly taxes: { readonly gst: string; readonly vat: string; readonly "service-tax": string; readonly none: string };
  /** The payment terms as the page shows them. */
  readonly terms: { readonly onReceipt: string; readonly days: Plural };
  readonly form: {
    readonly title: string;
    readonly description: string;
    readonly verb: string;
    readonly saved: string;
  };
  readonly validation: {
    readonly tradeNameRequired: string;
    readonly invalidEmail: string;
    /** Placeholders: `{max}`. */
    readonly tooLong: string;
    /** Placeholders: `{max}`. */
    readonly tooManyLines: string;
    /** Placeholders: `{min}`, `{max}`. */
    readonly rateRange: string;
    /** Placeholders: `{min}`, `{max}`. */
    readonly termsRange: string;
  };
}

export const businessSettingsMessageKey: MessageKey<BusinessSettingsMessages> =
  messageKey<BusinessSettingsMessages>("businessSettings");
