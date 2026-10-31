import { type MessageKey, messageKey, type PageMeta } from "@/core/i18n/client";

import type { InvoiceTaxId } from "./data";

/** Text of /dashboard/invoice: the form, the validation messages and the printed invoice. */
export interface InvoiceMessages {
  readonly meta: PageMeta;
  readonly title: string;
  readonly subtitle: string;
  readonly actions: { readonly saveDraft: string; readonly send: string };
  readonly tabs: { readonly invoice: string; readonly payment: string; readonly business: string };
  readonly details: {
    readonly reference: string;
    readonly issued: string;
    readonly due: string;
    readonly pickDate: string;
    readonly currency: string;
  };
  readonly client: {
    readonly billedTo: string;
    readonly add: string;
    readonly label: string;
    readonly select: string;
  };
  readonly items: {
    readonly title: string;
    readonly add: string;
    readonly description: string;
    readonly units: string;
    readonly unitCost: string;
    readonly lineTotal: string;
    /** Placeholders: `{name}`, the item's description. */
    readonly reorder: string;
    /** Placeholders: `{number}`. */
    readonly descriptionOf: string;
    /** Placeholders: `{number}`. */
    readonly quantityOf: string;
    /** Placeholders: `{number}`. */
    readonly unitPriceOf: string;
    /** Placeholders: `{number}`. */
    readonly remove: string;
  };
  readonly adjustments: {
    readonly title: string;
    readonly tax: string;
    readonly selectTax: string;
    readonly discount: string;
    readonly discountType: string;
    readonly fixed: string;
    readonly percent: string;
    readonly value: string;
  };
  /** Tax names by the ids of `invoiceTaxOptions`. */
  readonly taxes: Readonly<Record<InvoiceTaxId, string>>;
  /** Demo line items (business text, written in each language for the demo). */
  readonly demoItems: { readonly hosting: string; readonly analytics: string; readonly support: string };
  readonly preview: {
    readonly title: string;
    readonly print: string;
    readonly download: string;
    readonly loading: string;
  };
  /** The printed document. */
  readonly paper: {
    readonly invoice: string;
    /** Placeholders: `{label}`, `{value}`. French puts a no-break space before the colon. */
    readonly labelled: string;
    readonly reference: string;
    readonly issued: string;
    readonly paymentDue: string;
    readonly paymentAccount: string;
    readonly routingNumber: string;
    readonly from: string;
    readonly billTo: string;
    readonly taxId: string;
    readonly description: string;
    readonly units: string;
    readonly unitCost: string;
    readonly lineTotal: string;
    readonly netAmount: string;
    readonly discount: string;
    /** Placeholders: `{percent}`. */
    readonly discountPercent: string;
    /** Placeholders: `{tax}`, the tax name, `{rate}`. */
    readonly taxLine: string;
    readonly balanceDue: string;
    readonly promptProcessing: string;
    /** Placeholders: `{name}`. */
    readonly issuedBy: string;
  };
  /** Validation messages, used by the zod schema on the client and on any server that parses an invoice. */
  readonly validation: {
    readonly referenceRequired: string;
    readonly invalidDate: string;
    readonly dueBeforeIssue: string;
    readonly descriptionRequired: string;
    /** Placeholders: `{min}`, the bound the quantity must exceed. */
    readonly quantityPositive: string;
    readonly priceNotNegative: string;
    readonly discountNotNegative: string;
    /** Placeholders: `{max}`, the largest allowed percentage. */
    readonly percentTooHigh: string;
  };
}

export const invoiceMessageKey: MessageKey<InvoiceMessages> = messageKey<InvoiceMessages>("invoice");
