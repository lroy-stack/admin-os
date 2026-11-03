import { defineMessages, type ErrorMessages, type Plural } from "@/core/i18n";

export interface CustomersMessages {
  readonly title: string;
  readonly count: Plural;
}

export const customersMessages = defineMessages<CustomersMessages>({
  en: { title: "Customers", count: { one: "{count} customer", other: "{count} customers" } },
  es: { title: "Clientes", count: { one: "{count} cliente", other: "{count} clientes" } },
  de: { title: "Kunden", count: { one: "{count} Kunde", other: "{count} Kunden" } },
  fr: { title: "Clients", count: { one: "{count} client", other: "{count} clients" } },
});

/** Texts for the module's own error codes, in the shape `errorText` takes; other codes fall back to their class. */
export const customersErrors = defineMessages<ErrorMessages>({
  en: {
    "customers.duplicate":
      "A contact with this phone number or email already exists. Open it instead of creating a new one.",
    "customers.not_found": "This contact no longer exists.",
  },
  es: {
    "customers.duplicate": "Ya existe un contacto con este teléfono o correo. Ábrelo en lugar de crear uno nuevo.",
    "customers.not_found": "Este contacto ya no existe.",
  },
  de: {
    "customers.duplicate":
      "Ein Kontakt mit dieser Telefonnummer oder E-Mail-Adresse existiert bereits. Öffne ihn, statt einen neuen anzulegen.",
    "customers.not_found": "Dieser Kontakt existiert nicht mehr.",
  },
  fr: {
    "customers.duplicate":
      "Un contact avec ce numéro de téléphone ou cet e-mail existe déjà. Ouvrez-le au lieu d’en créer un nouveau.",
    "customers.not_found": "Ce contact n’existe plus.",
  },
});
