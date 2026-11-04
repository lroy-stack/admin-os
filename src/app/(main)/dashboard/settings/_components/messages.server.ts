import "server-only";

import { defineMessages, type MessageBundle } from "@/core/i18n";

import { type BusinessSettingsMessages, businessSettingsMessageKey } from "./messages";

const en: BusinessSettingsMessages = {
  meta: {
    title: "Business settings",
    description:
      "Your business details: who you are, where customers pay and how you bill, as your documents print them.",
  },
  title: "Settings",
  edit: "Edit",
  notSet: "Not set",
  ownerOnly: "Only the owner can change these details.",
  sections: {
    profile: { title: "Business", description: "The name and contact details your documents print." },
    payment: { title: "Payment details", description: "Where customers pay you, printed on invoices." },
    invoicing: { title: "Invoicing", description: "The tax a new invoice starts with, the rates and the days to pay." },
  },
  fields: {
    tradeName: "Trade name",
    legalName: "Legal name",
    taxId: "Tax ID",
    email: "Billing email",
    phone: "Phone",
    website: "Website",
    address: "Address",
    addressHint: "One line per row, up to {max}.",
    accountHolder: "Account holder",
    accountNumber: "Account number",
    bank: "Bank",
    defaultTax: "Default tax",
    rate: "{tax} rate (%)",
    paymentTerms: "Payment terms (days)",
    paymentTermsHint: "0 means due on receipt.",
  },
  taxes: { gst: "GST", vat: "VAT", "service-tax": "Service Tax", none: "No Tax" },
  terms: { onReceipt: "Due on receipt", days: { one: "{count} day", other: "{count} days" } },
  form: {
    title: "Edit business details",
    description: "These details appear on your invoices from now on.",
    verb: "Save",
    saved: "Business details saved.",
  },
  validation: {
    tradeNameRequired: "Enter the trade name.",
    invalidEmail: "Enter an email address, or leave it empty.",
    tooLong: "Use at most {max} characters.",
    tooManyLines: "Use at most {max} lines.",
    rateRange: "Enter a rate from {min} to {max}.",
    termsRange: "Enter a number of days from {min} to {max}.",
  },
};

const es: BusinessSettingsMessages = {
  meta: {
    title: "Ajustes del negocio",
    description:
      "Los datos de tu negocio: quién eres, dónde te pagan tus clientes y cómo facturas, tal como los imprimen tus documentos.",
  },
  title: "Ajustes",
  edit: "Editar",
  notSet: "Sin indicar",
  ownerOnly: "Solo el propietario puede cambiar estos datos.",
  sections: {
    profile: { title: "Negocio", description: "El nombre y los datos de contacto que imprimen tus documentos." },
    payment: { title: "Datos de pago", description: "Dónde te pagan tus clientes; aparece en las facturas." },
    invoicing: {
      title: "Facturación",
      description: "El impuesto con el que empieza una factura nueva, los tipos y los días para pagar.",
    },
  },
  fields: {
    tradeName: "Nombre comercial",
    legalName: "Razón social",
    taxId: "NIF",
    email: "Correo de facturación",
    phone: "Teléfono",
    website: "Sitio web",
    address: "Dirección",
    addressHint: "Una línea por fila, hasta {max}.",
    accountHolder: "Titular de la cuenta",
    accountNumber: "Número de cuenta",
    bank: "Banco",
    defaultTax: "Impuesto por defecto",
    rate: "Tipo de {tax} (%)",
    paymentTerms: "Plazo de pago (días)",
    paymentTermsHint: "0 significa pago a la entrega.",
  },
  taxes: { gst: "GST", vat: "IVA", "service-tax": "Impuesto sobre servicios", none: "Sin impuesto" },
  terms: { onReceipt: "Pago a la entrega", days: { one: "{count} día", other: "{count} días" } },
  form: {
    title: "Editar datos del negocio",
    description: "Estos datos aparecen en tus facturas a partir de ahora.",
    verb: "Guardar",
    saved: "Datos del negocio guardados.",
  },
  validation: {
    tradeNameRequired: "Introduce el nombre comercial.",
    invalidEmail: "Introduce un correo electrónico o déjalo vacío.",
    tooLong: "Usa como máximo {max} caracteres.",
    tooManyLines: "Usa como máximo {max} líneas.",
    rateRange: "Introduce un tipo entre {min} y {max}.",
    termsRange: "Introduce un número de días entre {min} y {max}.",
  },
};

const de: BusinessSettingsMessages = {
  meta: {
    title: "Unternehmenseinstellungen",
    description:
      "Die Daten deines Unternehmens: wer du bist, wohin Kunden zahlen und wie du abrechnest, so wie deine Dokumente sie drucken.",
  },
  title: "Einstellungen",
  edit: "Bearbeiten",
  notSet: "Nicht angegeben",
  ownerOnly: "Nur der Inhaber kann diese Daten ändern.",
  sections: {
    profile: { title: "Unternehmen", description: "Name und Kontaktdaten, die deine Dokumente drucken." },
    payment: { title: "Zahlungsdaten", description: "Wohin Kunden dich bezahlen; steht auf den Rechnungen." },
    invoicing: {
      title: "Rechnungsstellung",
      description: "Die Steuer, mit der eine neue Rechnung beginnt, die Sätze und das Zahlungsziel.",
    },
  },
  fields: {
    tradeName: "Handelsname",
    legalName: "Firmenname",
    taxId: "Steuer-ID",
    email: "Rechnungs-E-Mail",
    phone: "Telefon",
    website: "Website",
    address: "Adresse",
    addressHint: "Eine Zeile pro Reihe, bis zu {max}.",
    accountHolder: "Kontoinhaber",
    accountNumber: "Kontonummer",
    bank: "Bank",
    defaultTax: "Standardsteuer",
    rate: "{tax}-Satz (%)",
    paymentTerms: "Zahlungsziel (Tage)",
    paymentTermsHint: "0 bedeutet sofort fällig.",
  },
  taxes: { gst: "GST", vat: "MwSt.", "service-tax": "Dienstleistungssteuer", none: "Keine Steuer" },
  terms: { onReceipt: "Sofort fällig", days: { one: "{count} Tag", other: "{count} Tage" } },
  form: {
    title: "Unternehmensdaten bearbeiten",
    description: "Diese Daten stehen ab jetzt auf deinen Rechnungen.",
    verb: "Speichern",
    saved: "Unternehmensdaten gespeichert.",
  },
  validation: {
    tradeNameRequired: "Gib den Handelsnamen ein.",
    invalidEmail: "Gib eine E-Mail-Adresse ein oder lass das Feld leer.",
    tooLong: "Verwende höchstens {max} Zeichen.",
    tooManyLines: "Verwende höchstens {max} Zeilen.",
    rateRange: "Gib einen Satz von {min} bis {max} ein.",
    termsRange: "Gib eine Anzahl Tage von {min} bis {max} ein.",
  },
};

const fr: BusinessSettingsMessages = {
  meta: {
    title: "Paramètres de l’entreprise",
    description:
      "Les données de votre entreprise : qui vous êtes, où vos clients vous paient et comment vous facturez, telles que vos documents les impriment.",
  },
  title: "Paramètres",
  edit: "Modifier",
  notSet: "Non renseigné",
  ownerOnly: "Seul le propriétaire peut modifier ces données.",
  sections: {
    profile: { title: "Entreprise", description: "Le nom et les coordonnées que vos documents impriment." },
    payment: { title: "Coordonnées de paiement", description: "Où vos clients vous paient ; figure sur les factures." },
    invoicing: {
      title: "Facturation",
      description: "La taxe d’une nouvelle facture, les taux et le délai de paiement.",
    },
  },
  fields: {
    tradeName: "Nom commercial",
    legalName: "Raison sociale",
    taxId: "N° fiscal",
    email: "E-mail de facturation",
    phone: "Téléphone",
    website: "Site web",
    address: "Adresse",
    addressHint: "Une ligne par rangée, jusqu’à {max}.",
    accountHolder: "Titulaire du compte",
    accountNumber: "Numéro de compte",
    bank: "Banque",
    defaultTax: "Taxe par défaut",
    rate: "Taux de {tax} (%)",
    paymentTerms: "Délai de paiement (jours)",
    paymentTermsHint: "0 signifie payable à réception.",
  },
  taxes: { gst: "GST", vat: "TVA", "service-tax": "Taxe de service", none: "Sans taxe" },
  terms: { onReceipt: "Payable à réception", days: { one: "{count} jour", other: "{count} jours" } },
  form: {
    title: "Modifier les données de l’entreprise",
    description: "Ces données figurent désormais sur vos factures.",
    verb: "Enregistrer",
    saved: "Données de l’entreprise enregistrées.",
  },
  validation: {
    tradeNameRequired: "Saisissez le nom commercial.",
    invalidEmail: "Saisissez une adresse e-mail ou laissez le champ vide.",
    tooLong: "Utilisez au maximum {max} caractères.",
    tooManyLines: "Utilisez au maximum {max} lignes.",
    rateRange: "Saisissez un taux de {min} à {max}.",
    termsRange: "Saisissez un nombre de jours de {min} à {max}.",
  },
};

export const businessSettingsMessages = defineMessages<BusinessSettingsMessages>({ en, es, de, fr });

export const businessSettingsBundle: MessageBundle<BusinessSettingsMessages> = {
  key: businessSettingsMessageKey,
  dictionary: businessSettingsMessages,
};
