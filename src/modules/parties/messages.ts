import { defineMessages, type ErrorMessages, type Plural } from "@/core/i18n";

export interface PartiesMessages {
  readonly title: string;
  readonly count: Plural;
}

export const partiesMessages = defineMessages<PartiesMessages>({
  en: { title: "Parties", count: { one: "{count} party", other: "{count} parties" } },
  es: { title: "Terceros", count: { one: "{count} tercero", other: "{count} terceros" } },
  de: { title: "Geschäftspartner", count: { one: "{count} Geschäftspartner", other: "{count} Geschäftspartner" } },
  fr: { title: "Tiers", count: { one: "{count} tiers", other: "{count} tiers" } },
});

/** Texts for the module's own error codes, in the shape `errorText` takes; other codes fall back to their class. */
export const partiesErrors = defineMessages<ErrorMessages>({
  en: { "parties.not_found": "This client or supplier no longer exists." },
  es: { "parties.not_found": "Este cliente o proveedor ya no existe." },
  de: { "parties.not_found": "Dieser Kunde oder Lieferant existiert nicht mehr." },
  fr: { "parties.not_found": "Ce client ou ce fournisseur n’existe plus." },
});
