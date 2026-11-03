import { defineMessages, type MessageBundle } from "@/core/i18n";

import { type ContactFieldsMessages, contactFieldsMessageKey } from "./ui/messages";

const en: ContactFieldsMessages = {
  name: { label: "Name" },
  phone: { label: "Phone", hint: "With the country code, for example +34 600 000 101." },
  email: { label: "Email" },
  invalid: {
    name: "Enter a name.",
    phone: "Enter a phone number with its country code, for example +34 600 000 101.",
    email: "Enter a valid email address.",
  },
};

const es: ContactFieldsMessages = {
  name: { label: "Nombre" },
  phone: { label: "Teléfono", hint: "Con el prefijo del país, por ejemplo +34 600 000 101." },
  email: { label: "Correo" },
  invalid: {
    name: "Introduce un nombre.",
    phone: "Introduce un teléfono con su prefijo de país, por ejemplo +34 600 000 101.",
    email: "Introduce un correo válido.",
  },
};

const de: ContactFieldsMessages = {
  name: { label: "Name" },
  phone: { label: "Telefon", hint: "Mit Landesvorwahl, zum Beispiel +34 600 000 101." },
  email: { label: "E-Mail" },
  invalid: {
    name: "Gib einen Namen ein.",
    phone: "Gib eine Telefonnummer mit Landesvorwahl ein, zum Beispiel +34 600 000 101.",
    email: "Gib eine gültige E-Mail-Adresse ein.",
  },
};

const fr: ContactFieldsMessages = {
  name: { label: "Nom" },
  phone: { label: "Téléphone", hint: "Avec l’indicatif du pays, par exemple +34 600 000 101." },
  email: { label: "E-mail" },
  invalid: {
    name: "Saisissez un nom.",
    phone: "Saisissez un numéro de téléphone avec son indicatif, par exemple +34 600 000 101.",
    email: "Saisissez une adresse e-mail valide.",
  },
};

export const contactFieldsMessages = defineMessages<ContactFieldsMessages>({ en, es, de, fr });

/** Pass to `LocaleBundles` on a screen that shows the contact fields. */
export const contactFieldsBundle: MessageBundle<ContactFieldsMessages> = {
  key: contactFieldsMessageKey,
  dictionary: contactFieldsMessages,
};
